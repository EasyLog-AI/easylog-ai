from datetime import datetime
from typing import Literal

import pytz
from fastapi import APIRouter, HTTPException, Path, Query, Response
from prisma import Json

from src.lib.prisma import prisma
from src.logger import logger
from src.models.pagination import Pagination
from src.models.threads import ThreadCreateInput, ThreadResponse
from src.services.messages.utils.db_message_to_message_model import (
    db_message_to_message_model,
)
from src.utils.is_valid_uuid import is_valid_uuid

router = APIRouter()


async def _ensure_welcome_message(
    thread_id: str, external_id: str | None
) -> None:
    """Ensure thread has a welcome message if it's a new/expired session.

    Two-tier welcome system:
    1. First visit (empty thread): Full onboarding message
    2. Return visit (24h+ inactive): Personalized "welcome back" with name

    Args:
        thread_id: The thread ID
        external_id: The external ID (used to determine agent_class)
    """
    # Map external_id patterns to agent_class
    # NOTE: Order matters - more specific patterns first!
    agent_class_map = {
        "mumc-server-test": "MUMCAgentTest",  # Test environment
        "mumc-server": "MUMCAgent",            # Production environment
        # Add more agents here when needed
    }

    # Determine agent_class from external_id
    agent_class = None
    if external_id:
        for pattern, cls in agent_class_map.items():
            if pattern in external_id:
                agent_class = cls
                break

    if not agent_class:
        # No mapping found, skip welcome message
        return

    # Get thread with messages
    thread = await prisma.threads.find_unique(
        where={"id": thread_id},
        include={"messages": True},
    )

    if not thread:
        return

    # Get metadata
    metadata = dict(thread.metadata) if thread.metadata else {}
    last_interaction = metadata.get("last_interaction_time")
    last_welcome_date = metadata.get("last_welcome_date")

    # Current time
    current_time = datetime.now(pytz.timezone("Europe/Amsterdam"))
    current_date = current_time.date().isoformat()

    # Configuration
    # TODO: Change to 1440 (24 hours) for production
    SESSION_TIMEOUT_MINUTES = 15

    # Determine if we should add welcome message
    should_add_welcome = False
    welcome_reason = ""
    welcome_text = ""
    is_welcome_back = False

    # Scenario 1: Empty thread (first visit)
    if len(thread.messages or []) == 0:
        if last_interaction is None:
            # First time ever
            should_add_welcome = True
            welcome_reason = "first_time"
            welcome_text = (
                "👋 Hallo!\n\n"
                "Welkom bij de 1e testversie van de nieuwe "
                "E-Supporter app van Easylog en het MUMC+.\n\n"
                "Zullen we beginnen met testen?"
            )

    # Scenario 2: Thread has messages - check for "welcome back"
    elif last_interaction:
        try:
            last_time = datetime.fromisoformat(last_interaction)
            time_diff = current_time - last_time
            inactive_minutes = time_diff.total_seconds() / 60

            # Check if enough time has passed AND not already welcomed today
            if (
                inactive_minutes > SESSION_TIMEOUT_MINUTES
                and last_welcome_date != current_date
            ):
                should_add_welcome = True
                is_welcome_back = True
                welcome_reason = f"welcome_back_{inactive_minutes:.0f}min"

                # Extract user name from memories if available
                memories = metadata.get("memories", {})
                user_name = None

                # Debug logging for memories
                logger.info(
                    f"Thread {thread_id} memories type: "
                    f"{type(memories)}, keys: "
                    f"{list(memories.keys()) if isinstance(memories, dict) else 'N/A'}"
                )

                # Try to find name in memories
                # (could be stored as "naam" or "name")
                if isinstance(memories, dict):
                    user_name = (
                        memories.get("naam") or memories.get("name")
                    )
                    logger.info(
                        f"Thread {thread_id} extracted name: "
                        f"{user_name if user_name else 'None found'}"
                    )

                # Build personalized welcome back message
                if user_name:
                    welcome_text = (
                        f"👋 Hallo {user_name}!\n\n"
                        "Fijn dat je er weer bent. "
                        "Hoe gaat het vandaag met je?"
                    )
                else:
                    welcome_text = (
                        "👋 Hallo!\n\n"
                        "Fijn dat je er weer bent. "
                        "Hoe gaat het vandaag met je?"
                    )
        except Exception as e:
            logger.warning(
                f"Error parsing last_interaction_time for thread "
                f"{thread_id}: {e}"
            )

    # Add welcome message if needed
    if should_add_welcome:
        logger.info(
            f"Adding welcome message to thread {thread_id} "
            f"(reason: {welcome_reason}, agent: {agent_class}, "
            f"welcome_back: {is_welcome_back})"
        )

        # Create welcome message
        welcome_msg = await prisma.messages.create(
            data={
                "thread_id": thread_id,
                "role": "assistant",
                "agent_class": agent_class,
            }
        )

        # Add text content
        await prisma.message_contents.create(
            data={
                "message_id": welcome_msg.id,
                "type": "text",
                "text": welcome_text,
            }
        )

        # Update metadata
        metadata["last_interaction_time"] = current_time.isoformat()
        if is_welcome_back:
            metadata["last_welcome_date"] = current_date

        await prisma.threads.update(
            where={"id": thread_id}, data={"metadata": Json(metadata)}
        )


@router.get(
    "/threads",
    name="get_threads",
    tags=["threads"],
    response_model=Pagination[ThreadResponse],
    description="Retrieves all threads. Returns a list of all threads with their messages by default in descending chronological order (newest first). Each message includes its full content.",
)
async def get_threads(
    limit: int = Query(
        default=10,
        ge=1,
        le=100,
    ),
    offset: int = Query(default=0, ge=0),
    order: Literal["asc", "desc"] = Query(default="desc"),
) -> Pagination[ThreadResponse]:
    threads = await prisma.threads.find_many(
        take=limit,
        skip=offset,
        order={"created_at": order},
        include={
            "messages": {
                "order_by": {"created_at": order},
                "include": {
                    "contents": True,
                },
            }
        },
    )

    return Pagination(
        data=[
            ThreadResponse(
                **thread.model_dump(exclude={"messages"}),
                messages=[db_message_to_message_model(message) for message in thread.messages or []],
            )
            for thread in threads
        ],
        limit=limit,
        offset=offset,
    )


@router.get(
    "/threads/{id}",
    name="get_thread_by_id",
    tags=["threads"],
    response_model=ThreadResponse,
    responses={
        404: {"description": "Thread not found"},
    },
    description="Retrieves a specific thread by its unique ID. Returns the thread details along with its messages in descending chronological order (newest first). Each message includes its full content.",
)
async def get_thread_by_id(
    _id: str = Path(
        ...,
        alias="id",
        description="The unique identifier of the thread. Can be either the internal ID or external ID.",
    ),
) -> ThreadResponse:
    thread = await prisma.threads.find_first(
        where={"id": _id} if is_valid_uuid(_id) else {"external_id": _id},
        include={
            "messages": {
                "order_by": {"created_at": "desc"},
                "include": {
                    "contents": True,
                },
            }
        },
    )

    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    # Ensure welcome message exists for new/expired sessions
    await _ensure_welcome_message(thread.id, thread.external_id)

    # Refetch thread to include any newly added welcome message
    thread = await prisma.threads.find_first(
        where={"id": thread.id},
        include={
            "messages": {
                "order_by": {"created_at": "desc"},
                "include": {
                    "contents": True,
                },
            }
        },
    )

    return ThreadResponse(
        **thread.model_dump(exclude={"messages"}),
        messages=[db_message_to_message_model(message) for message in thread.messages or []],
    )


@router.post(
    "/threads",
    name="create_thread",
    tags=["threads"],
    response_model=ThreadResponse,
    description="Creates a new thread or returns the existing thread if it already exists.",
)
async def create_thread(thread: ThreadCreateInput) -> ThreadResponse:
    if thread.external_id:
        result = await prisma.threads.upsert(
            where={
                "external_id": thread.external_id,
            },
            data={
                "create": {
                    "external_id": thread.external_id,
                },
                "update": {},
            },
            include={
                "messages": {
                    "order_by": {"created_at": "desc"},
                    "include": {
                        "contents": True,
                    },
                }
            },
        )
    else:
        result = await prisma.threads.create(
            data={"external_id": thread.external_id},
            include={
                "messages": {
                    "order_by": {"created_at": "desc"},
                    "include": {
                        "contents": True,
                    },
                }
            },
        )

    return ThreadResponse(
        **result.model_dump(exclude={"messages"}),
        messages=[db_message_to_message_model(message) for message in result.messages or []],
    )


@router.delete(
    "/threads/{id}",
    name="delete_thread",
    tags=["threads"],
    description="Deletes a thread by its internal or external ID.",
)
async def delete_thread(
    _id: str = Path(
        ...,
        alias="id",
        description="The unique identifier of the thread. Can be either the internal ID or external ID.",
    ),
) -> Response:
    await prisma.threads.delete_many(
        where={"id": _id} if is_valid_uuid(_id) else {"external_id": _id},
    )

    return Response(status_code=204)
