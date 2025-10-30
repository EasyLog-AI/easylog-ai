# Context Management Implementation Guide

## Quick Start voor Development Team

Deze guide bevat concrete code die je **direct kunt implementeren** in de EasyLog agents.

---

## Quick Win #1: Token Counting & Monitoring

**Files to create**: `apps/api/src/agents/utils/context_manager.py`

```python
"""Context window management for AI agents."""

import logging
from collections.abc import Iterable
from typing import Any

import tiktoken
from openai.types.chat import ChatCompletionMessageParam

logger = logging.getLogger(__name__)


class ContextManager:
    """Manage context window size and pruning for agents.

    Usage:
        manager = ContextManager(max_tokens=150000)

        if manager.needs_pruning(messages):
            pruned, summary = manager.prune_context(messages, system_prompt)
    """

    def __init__(
        self,
        max_tokens: int = 150000,
        target_tokens: int = 100000,
        model: str = "claude-3-5-sonnet-20241022",
    ) -> None:
        """Initialize context manager.

        Args:
            max_tokens: Maximum token limit (default: 150K for Claude Sonnet 4)
            target_tokens: Target to stay under (leave room for response)
            model: Model name for token encoding
        """
        self.max_tokens = max_tokens
        self.target_tokens = target_tokens

        # Use GPT-4 encoding as approximation (close enough for Claude)
        self.encoding = tiktoken.encoding_for_model("gpt-4")

        logger.info(
            f"ContextManager initialized: max={max_tokens}, target={target_tokens}"
        )

    def count_tokens(
        self,
        messages: Iterable[ChatCompletionMessageParam]
    ) -> int:
        """Count total tokens in message list.

        Args:
            messages: List of chat completion messages

        Returns:
            Total token count (approximate)
        """
        total = 0

        for message in messages:
            # Every message has overhead for role/metadata
            total += 4

            # Count content tokens
            content = message.get("content")
            if isinstance(content, str):
                total += len(self.encoding.encode(content))
            elif isinstance(content, list):
                for part in content:
                    if part.get("type") == "text":
                        text = part.get("text", "")
                        total += len(self.encoding.encode(text))

            # Count tool calls if present
            if "tool_calls" in message:
                tool_calls = message.get("tool_calls", [])
                for tool_call in tool_calls:
                    # Serialize tool call to JSON string and count
                    import json
                    tool_str = json.dumps(tool_call)
                    total += len(self.encoding.encode(tool_str))

        return total

    def needs_pruning(
        self,
        messages: Iterable[ChatCompletionMessageParam]
    ) -> bool:
        """Check if message list exceeds target token count.

        Args:
            messages: List of chat completion messages

        Returns:
            True if pruning is needed
        """
        token_count = self.count_tokens(messages)
        needs_prune = token_count > self.target_tokens

        if needs_prune:
            logger.warning(
                f"Context pruning needed: {token_count} tokens > {self.target_tokens} target"
            )

        return needs_prune

    def prune_context(
        self,
        messages: list[ChatCompletionMessageParam],
        system_prompt: str = "",
    ) -> tuple[list[ChatCompletionMessageParam], str]:
        """Intelligently prune context to fit within target token limit.

        Strategy:
        1. Always keep recent messages (last 20)
        2. Always keep first few messages (first 5)
        3. Summarize everything in the middle
        4. Remove old tool results (they're usually large)

        Args:
            messages: Full message list
            system_prompt: Current system prompt (for context)

        Returns:
            Tuple of (pruned_messages, summary_of_removed_content)
        """
        if not self.needs_pruning(messages):
            return messages, ""

        # Configuration
        keep_recent = 20  # Keep last 20 messages
        keep_first = 5    # Keep first 5 messages

        total_messages = len(messages)

        # If total is small, don't prune
        if total_messages <= (keep_recent + keep_first):
            logger.info("Message count too small to prune effectively")
            return messages, ""

        # Split into sections
        first_section = messages[:keep_first]
        middle_section = messages[keep_first:-keep_recent]
        recent_section = messages[-keep_recent:]

        logger.info(
            f"Pruning context: keeping {keep_first} first + {keep_recent} recent, "
            f"summarizing {len(middle_section)} middle messages"
        )

        # Create summary of middle section
        summary = self._create_conversation_summary(middle_section)

        # Create summary message to insert
        summary_message: ChatCompletionMessageParam = {
            "role": "system",
            "content": f"""
## CONVERSATION SUMMARY (Compressed Context)

To save tokens, the following is a summary of earlier conversation:

{summary}

---

**Note**: This summary compressed {len(middle_section)} messages. Full details were
stored in the database and can be retrieved if needed.

Current conversation continues below:
""".strip()
        }

        # Reconstruct message list
        pruned_messages = [
            *first_section,
            summary_message,
            *recent_section,
        ]

        # Log results
        original_tokens = self.count_tokens(messages)
        pruned_tokens = self.count_tokens(pruned_messages)
        savings_pct = ((original_tokens - pruned_tokens) / original_tokens) * 100

        logger.info(
            f"Context pruned: {original_tokens} → {pruned_tokens} tokens "
            f"({savings_pct:.1f}% reduction)"
        )

        return pruned_messages, summary

    def _create_conversation_summary(
        self,
        messages: list[ChatCompletionMessageParam],
    ) -> str:
        """Create concise summary of conversation section.

        Extracts:
        - User questions
        - Assistant actions
        - Tool usage patterns
        - Key information exchanged

        Args:
            messages: Messages to summarize

        Returns:
            Formatted summary string
        """
        # Extract key elements
        user_topics: list[str] = []
        assistant_actions: list[str] = []
        tool_usage: dict[str, int] = {}

        for msg in messages:
            role = msg.get("role")
            content = msg.get("content")

            # Track user questions
            if role == "user":
                if isinstance(content, str) and content:
                    # Take first 150 chars as topic
                    topic = content[:150].strip()
                    if len(content) > 150:
                        topic += "..."
                    user_topics.append(topic)

            # Track assistant responses
            elif role == "assistant":
                if isinstance(content, str) and content:
                    action = content[:100].strip()
                    if len(content) > 100:
                        action += "..."
                    assistant_actions.append(action)

            # Track tool calls
            if "tool_calls" in msg:
                for tool_call in msg.get("tool_calls", []):
                    tool_name = tool_call.get("function", {}).get("name", "unknown")
                    tool_usage[tool_name] = tool_usage.get(tool_name, 0) + 1

        # Build summary sections
        summary_parts = []

        if user_topics:
            summary_parts.append(
                "**User discussed**: " +
                " | ".join(user_topics[:3])  # Show max 3 topics
            )

        if assistant_actions:
            summary_parts.append(
                "**Assistant provided**: " +
                " | ".join(assistant_actions[:3])
            )

        if tool_usage:
            tool_summary = ", ".join(
                f"{name}({count}x)" for name, count in tool_usage.items()
            )
            summary_parts.append(f"**Tools used**: {tool_summary}")

        if not summary_parts:
            return "No significant activity in this section"

        return "\n\n".join(summary_parts)
```

---

## Quick Win #2: Integration in MUMCAgent

**File to modify**: `apps/api/src/agents/implementations/mumc_agent.py`

```python
# Add import at top
from src.agents.utils.context_manager import ContextManager

class MUMCAgent(BaseAgent[MUMCAgentConfig]):

    def on_init(self) -> None:
        # Existing code...
        self.configure_onesignal(
            settings.ONESIGNAL_HEALTH_API_KEY,
            settings.ONESIGNAL_HEALTH_APP_ID,
        )

        # NEW: Initialize context manager
        self.context_manager = ContextManager(
            max_tokens=150000,  # Claude Sonnet 4: 200K token window
            target_tokens=100000,  # Leave 50K for response + buffer
        )

        self.logger.info(f"Request headers: {self.request_headers}")

    async def on_message(
        self,
        messages: Iterable[ChatCompletionMessageParam],
        _: int = 0
    ) -> tuple[AsyncStream[ChatCompletionChunk] | ChatCompletion, list[Callable]]:

        # Convert to list for manipulation
        message_list = list(messages)

        # NEW: Log token usage
        token_count = self.context_manager.count_tokens(message_list)
        self.logger.info(f"📊 Context size: {token_count} tokens, {len(message_list)} messages")

        # NEW: Check if pruning is needed
        if self.context_manager.needs_pruning(message_list):
            self.logger.warning(f"⚠️ Context exceeds target, pruning...")

            # Prune the context
            pruned_messages, summary = self.context_manager.prune_context(
                message_list,
                system_prompt=llm_content,  # From existing code below
            )

            # Store summary for future reference
            summaries = await self.get_metadata("conversation_summaries", [])
            summaries.append({
                "id": str(uuid.uuid4())[:8],
                "timestamp": datetime.now(pytz.timezone("Europe/Amsterdam")).isoformat(),
                "summary": summary,
                "messages_before": len(message_list),
                "messages_after": len(pruned_messages),
                "tokens_before": token_count,
                "tokens_after": self.context_manager.count_tokens(pruned_messages),
            })
            await self.set_metadata("conversation_summaries", summaries[-10:])  # Keep last 10

            # Use pruned messages
            message_list = pruned_messages

            self.logger.info(
                f"✅ Context pruned: {len(messages)} → {len(pruned_messages)} messages"
            )

        # EXISTING CODE continues here (get role, tools, etc.)
        role_config = await self.get_current_role()
        tools = self.get_tools()
        # ... rest of existing code ...

        # Use message_list instead of messages in the API call
        response = await self.client.chat.completions.create(
            model=role_config.model,
            messages=[
                {"role": "system", "content": llm_content},
                *message_list,  # <- Changed from messages to message_list
            ],
            stream=True,
            extra_body={
                "reasoning": {
                    "enabled": role_config.reasoning.enabled,
                    "effort": role_config.reasoning.effort,
                }
            },
            tools=[function_to_openai_tool(tool) for tool in tools_values],
            tool_choice="auto",
        )

        return response, list(tools_values)
```

---

## Quick Win #3: Monitoring Dashboard

**File to create**: `apps/api/src/api/monitoring.py`

```python
"""API endpoints for context and token monitoring."""

from fastapi import APIRouter, Query
from pydantic import BaseModel

from src.lib.prisma import prisma

router = APIRouter(prefix="/monitoring", tags=["monitoring"])


class ThreadStatsResponse(BaseModel):
    thread_id: str
    total_messages: int
    estimated_tokens: int
    has_summaries: bool
    summary_count: int
    last_pruned_at: str | None


@router.get("/thread-stats/{thread_id}")
async def get_thread_stats(thread_id: str) -> ThreadStatsResponse:
    """Get context statistics for a thread."""

    # Get message count
    message_count = await prisma.messages.count(
        where={"thread_id": thread_id}
    )

    # Get thread metadata
    thread = await prisma.threads.find_unique(
        where={"id": thread_id}
    )

    if not thread:
        raise ValueError(f"Thread {thread_id} not found")

    # Extract summary info from metadata
    summaries = thread.metadata.get("conversation_summaries", [])
    last_pruned = None
    if summaries:
        last_pruned = summaries[-1].get("timestamp")

    # Rough token estimate (avg 500 tokens per message)
    estimated_tokens = message_count * 500

    return ThreadStatsResponse(
        thread_id=thread_id,
        total_messages=message_count,
        estimated_tokens=estimated_tokens,
        has_summaries=len(summaries) > 0,
        summary_count=len(summaries),
        last_pruned_at=last_pruned,
    )


class TokenUsageStats(BaseModel):
    total_threads: int
    avg_messages_per_thread: float
    threads_needing_pruning: int
    estimated_monthly_cost: float


@router.get("/token-usage")
async def get_token_usage_stats() -> TokenUsageStats:
    """Get overall token usage statistics."""

    # Get all threads
    threads = await prisma.threads.find_many()

    total_threads = len(threads)
    if total_threads == 0:
        return TokenUsageStats(
            total_threads=0,
            avg_messages_per_thread=0,
            threads_needing_pruning=0,
            estimated_monthly_cost=0,
        )

    # Calculate stats
    total_messages = 0
    threads_over_threshold = 0

    for thread in threads:
        msg_count = await prisma.messages.count(
            where={"thread_id": thread.id}
        )
        total_messages += msg_count

        # Check if over 200 messages (likely needs pruning)
        if msg_count > 200:
            threads_over_threshold += 1

    avg_messages = total_messages / total_threads

    # Cost estimation
    # Assume: 500 tokens/message, 5 messages/day, Claude Sonnet 4 pricing
    avg_tokens_per_request = avg_messages * 500
    cost_per_request = (avg_tokens_per_request / 1_000_000) * 3  # $3 per 1M tokens
    requests_per_month = 30 * 5  # 5 per day
    monthly_cost = cost_per_request * requests_per_month * total_threads

    return TokenUsageStats(
        total_threads=total_threads,
        avg_messages_per_thread=avg_messages,
        threads_needing_pruning=threads_over_threshold,
        estimated_monthly_cost=monthly_cost,
    )
```

**Add to main.py**:

```python
from src.api import monitoring

app.include_router(monitoring.router)
```

---

## Testing

### Unit Tests

**File**: `apps/api/tests/agents/test_context_manager.py`

```python
"""Tests for context manager."""

import pytest
from openai.types.chat import ChatCompletionMessageParam

from src.agents.utils.context_manager import ContextManager


@pytest.fixture
def context_manager() -> ContextManager:
    return ContextManager(max_tokens=10000, target_tokens=5000)


def test_token_counting(context_manager: ContextManager) -> None:
    """Test basic token counting."""
    messages: list[ChatCompletionMessageParam] = [
        {"role": "user", "content": "Hello, how are you?"},
        {"role": "assistant", "content": "I'm doing well, thank you!"},
    ]

    token_count = context_manager.count_tokens(messages)
    assert token_count > 0
    assert token_count < 100  # Should be ~20-30 tokens


def test_needs_pruning(context_manager: ContextManager) -> None:
    """Test pruning detection."""
    # Small message list - no pruning needed
    small_messages: list[ChatCompletionMessageParam] = [
        {"role": "user", "content": "Hi"}
    ]
    assert not context_manager.needs_pruning(small_messages)

    # Large message list - pruning needed
    large_content = "word " * 2000  # ~2000 words = ~2500 tokens
    large_messages: list[ChatCompletionMessageParam] = [
        {"role": "user", "content": large_content},
        {"role": "assistant", "content": large_content},
        {"role": "user", "content": large_content},
    ]
    assert context_manager.needs_pruning(large_messages)


def test_context_pruning(context_manager: ContextManager) -> None:
    """Test context pruning preserves structure."""
    messages: list[ChatCompletionMessageParam] = [
        {"role": "user", "content": f"Message {i}"}
        for i in range(30)
    ]

    pruned, summary = context_manager.prune_context(messages)

    # Should have fewer messages
    assert len(pruned) < len(messages)

    # Should have summary
    assert summary != ""

    # Should preserve recent messages
    assert pruned[-1]["content"] == "Message 29"
```

---

## Deployment Checklist

### Pre-deployment

- [ ] Review code with team
- [ ] Run all unit tests
- [ ] Test on staging with real thread data
- [ ] Monitor performance impact
- [ ] Document any config changes

### Deployment Steps

```bash
# 1. Commit changes
git add apps/api/src/agents/utils/context_manager.py
git add apps/api/src/agents/implementations/mumc_agent.py
git commit -m "feat: Add context management with intelligent pruning"

# 2. Deploy to staging
ssh easylog-python
cd /path/to/easylog-ai
git pull
docker-compose restart api

# 3. Test on staging
curl -X GET "https://staging-api.easylog.nu/monitoring/token-usage"

# 4. Monitor logs
docker logs easylog-python-server.api -f | grep "Context"
```

### Post-deployment

- [ ] Monitor error rates (should be unchanged)
- [ ] Check token usage reduction
- [ ] Verify response quality
- [ ] Collect user feedback
- [ ] Document learnings

---

## FAQ

**Q: Will this break existing conversations?**  
A: No. Pruning only affects the messages sent to the API, not what's stored in the database.

**Q: What if pruning removes important context?**  
A: The algorithm keeps the most recent 20 messages and first 5 messages. Critical info should be in memories anyway.

**Q: How much will this save in costs?**  
A: Estimated 30-40% reduction for threads >200 messages. Minimal impact on shorter conversations.

**Q: Can I adjust the pruning parameters?**  
A: Yes! Modify `keep_recent` and `keep_first` in `prune_context()`.

**Q: Does this work with OpenRouter?**  
A: Yes! This is model-agnostic and works with any OpenAI-compatible API.

---

## Support

**Questions?** Contact development team lead  
**Issues?** Create ticket in project management system  
**Improvements?** Submit PR with proposed changes
