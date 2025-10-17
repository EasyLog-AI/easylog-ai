# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Quick Start

```bash
# Automatic installation (macOS only)
./install.sh

# Start development server
pnpm run dev
```

### Manual Development Setup

```bash
# Install dependencies
cd apps/api && uv sync && cd ../..
pnpm install

# Database setup
cd apps/api && uv run prisma db push && cd ../..

# Start all services
pnpm run dev
```

### Common Commands

```bash
# Build all applications
pnpm run build

# Start production
pnpm run start

# Lint code
pnpm run lint
ruff check apps/api/src/
ruff format apps/api/src/

# Run tests
cd apps/api && uv run pytest

# Format code
prettier --write --ignore-path .gitignore .
```

### Server Management

```bash
# Connect to production server
ssh easylog-python

# View live server logs (read-only monitoring)
ssh easylog-python "docker logs easylog-python-server.api -f"
```

## Architecture Overview

This is a monorepo containing a Python FastAPI backend (`apps/api`) and Next.js frontend (`apps/web`) for the EasyLog AI agent platform. The system provides a flexible multi-tenant framework for building customized AI solutions.

### Core Components

**Python API (`apps/api/src/`)**

- `main.py` - FastAPI application with middleware, CORS, timeouts, and lifecycle management
- `agents/` - Agent system with BaseAgent class and role-based configurations
- `api/` - REST endpoints for threads, messages, health, knowledge, and steps
- `services/` - Business logic including message processing and super agent automation
- `lib/` - External integrations (OpenAI, Weaviate, Prisma, Neo4j/Graphiti)
- `models/` - Pydantic data models and database schemas

**Agent System Architecture**

- Agents inherit from `BaseAgent[TConfig]` with type-safe configuration
- Role-based access control with regex filtering for tool permissions
- Two super agent implementations:
  - **Web Environment** (TypeScript/Next.js) - **Current/Recommended** - Trigger.dev-based scheduling
  - **Python Environment** (FastAPI) - Legacy - APScheduler-based scheduling
- OpenRouter.ai integration for access to 300+ AI models

**Key Integrations**

- **Database**: Prisma ORM with PostgreSQL
- **Vector Search**: Weaviate for document embeddings and knowledge retrieval
- **Knowledge Graph**: Neo4j via Graphiti for relationship mapping
- **AI Models**: OpenRouter.ai for model routing (Claude, GPT-4, etc.)
- **Notifications**: OneSignal for push notifications
- **Scheduling**:
  - **Web Environment**: Trigger.dev for distributed task scheduling (current)
  - **Python Environment**: APScheduler for background jobs (legacy)

### Agent Implementations (Python Environment)

These are Python-based agent implementations in `apps/api/src/agents/implementations/`:

- `easylog_agent.py` - Production agent with comprehensive tools
- `mumc_agent.py` - Healthcare/COPD-focused agent with ZLM charts
- `debug_agent.py` - Development agent with enhanced logging
- `rick_thropic_agent.py` - Personal assistant agent

**Note**: These Python agents have built-in super agent capabilities via `on_super_agent_call()` and `super_agent_config()`, but the scheduling is handled differently than the web environment (see below).

## Super Agents

Super agents are autonomous AI agents that run on scheduled intervals to perform background tasks. They operate on existing user chats and can send messages, analyze data, and perform automated actions.

### Two Super Agent Implementations

This project has **two different super agent systems**:

| Feature           | Web Environment ✨               | Python Environment (Legacy)         |
| ----------------- | -------------------------------- | ----------------------------------- |
| **Status**        | Current & Recommended            | Legacy/Maintenance Only             |
| **Location**      | `apps/web/src/jobs/super-agent/` | `apps/api/src/agents/base_agent.py` |
| **Language**      | TypeScript/Next.js               | Python/FastAPI                      |
| **Scheduling**    | Trigger.dev (distributed)        | APScheduler (local)                 |
| **Configuration** | Database (`super_agents` table)  | Code (`super_agent_config()`)       |
| **Management**    | API/Database updates             | Code changes + restart              |
| **Scalability**   | High (distributed tasks)         | Low (single server)                 |
| **Observability** | Trigger.dev dashboard            | Server logs                         |
| **When to Use**   | **All new super agents**         | Maintaining existing only           |

**Summary:**

1. **Web Environment (TypeScript/Next.js)** - **✨ Current & Recommended**

   - Located in `apps/web/src/jobs/super-agent/`
   - Uses Trigger.dev for distributed scheduling
   - Database-driven configuration via `super_agents` table
   - More flexible and scalable
   - **Use this for new super agents**

2. **Python Environment (FastAPI)** - **Legacy**
   - Built into agent classes via `BaseAgent.on_super_agent_call()`
   - Uses APScheduler for local scheduling
   - Configured via `super_agent_config()` in agent implementations
   - Less flexible, harder to manage
   - **Only modify if maintaining existing Python super agents**

### Creating New Super Agents (Web Environment)

**When working on this project, you should typically use the web environment for super agents unless specifically told otherwise.**

#### How It Works

The web environment super agent system uses a database-driven approach:

1. **Database Storage**: Super agents are stored in the `super_agents` table with configuration
2. **Trigger.dev Scheduling**: Schedules are created via Trigger.dev API and stored by schedule ID
3. **Dispatch Job** (`dispatch-super-agent-agent-job.ts`):
   - Triggered by Trigger.dev on schedule
   - Finds the super agent by `externalId` (super agent ID)
   - Gets all users' latest chats for the associated agent
   - Dispatches individual `run-super-agent` jobs for each chat
4. **Run Job** (`run-super-agent-job.ts`):
   - Executes for a specific user chat
   - Uses AI SDK with OpenRouter models
   - Has access to tools: scratchpad, memory, SQL, knowledge base, chat messaging
   - Can write messages back to the chat

**Key Features:**

- **Scratchpad**: Private notes that persist between runs for state tracking
- **User Memories**: Access to user-specific memories for context
- **Chat History**: Full access to conversation history
- **Flexible Tools**: SQL queries, knowledge base search, memory management
- **Language Awareness**: Automatically matches conversation language

#### Prerequisites

- Access to Neon database (production project: `still-wind-33703124`)
- Trigger.dev production API key (starts with `tr_prod_`)
- Database schema reference: `apps/web/src/database/schema.ts`

#### Step-by-Step Process

**1. Confirm the Target Environment**

- Always ask the user which environment to use (dev/staging/production)
- For production, use the Neon project `still-wind-33703124`

**2. List Available Agents**

```sql
SELECT id, name, slug FROM agents ORDER BY created_at DESC LIMIT 10
```

- Ask the user which agent the super agent should be attached to
- Common options: Develop, MUMC, HG, etc.

**3. Create the Super Agent Database Record**

```sql
INSERT INTO super_agents (name, model, reasoning, reasoning_effort, agent_id, prompt)
VALUES (
  'Your Super Agent Name',
  'gpt-4o-mini',  -- or another model
  false,          -- enable reasoning if needed
  'low',          -- reasoning effort: low/medium/high
  '<agent-id>',   -- from step 2
  'Your detailed prompt explaining what the super agent should do'
)
RETURNING id, name, agent_id
```

- Save the returned `id` - this is your `superAgentId`

**4. Create the Trigger.dev Schedule**

Use curl to create the schedule via the Trigger.dev API:

```bash
curl -X POST https://api.trigger.dev/api/v1/schedules \
  -H "Authorization: Bearer <TRIGGER_SECRET_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "task": "dispatch-super-agents",
    "cron": "*/10 * * * *",  # Cron expression for interval
    "timezone": "Europe/Amsterdam",  # Always use Amsterdam timezone
    "externalId": "<superAgentId>",
    "deduplicationKey": "superAgentId:<superAgentId>"
  }'
```

- The response will include a `schedule.id` (starts with `sched_`)
- **IMPORTANT**: Always include `"timezone": "Europe/Amsterdam"` in the request body to schedule in Amsterdam timezone (IANA format)
- Common cron intervals:
  - `*/10 * * * *` - Every 10 minutes
  - `0 */2 * * *` - Every 2 hours
  - `0 */3 * * *` - Every 3 hours
  - `0 7 * * *` - Every day at 7:00 AM (Amsterdam time if timezone is set)

**5. Update Super Agent with Schedule ID**

```sql
UPDATE super_agents
SET schedule_id = '<schedule-id-from-step-4>'
WHERE id = '<superAgentId>'
RETURNING id, name, schedule_id
```

#### Important Notes

- **Environment Keys**: Make sure to use the correct Trigger.dev API key:

  - Dev: `tr_dev_...` (in `apps/web/.env`)
  - Production: `tr_prod_...` (in `apps/web/.env`, commented by default)

- **Task Reference**: The schedule always uses `dispatch-super-agents` as the task ID (defined in `dispatch-super-agent-agent-job.ts`). This task:

  - Finds the super agent by `externalId` (the super agent database ID)
  - Gets all user chats for the associated agent
  - Dispatches individual `run-super-agent` jobs (from `run-super-agent-job.ts`) for each user's latest chat

- **Prompt Design**: The super agent prompt should:
  - Clearly explain the autonomous task
  - Specify conditions for when to act (e.g., "if last message was from user")
  - Include available tools to use
  - Be concise but complete

#### Example: Emoji Agent

This example creates a super agent that adds random emojis to user messages:

1. Environment: Production (`still-wind-33703124`)
2. Agent: Develop (`309b0d7b-ef52-4824-b413-4cddd1b8abee`)
3. Database record created with prompt:
   ```
   You are the Emoji Agent. Your task is to check if the last message in
   the conversation was from a user. If it was, add a random emoji as a
   new assistant message. Use the send_message tool to add the emoji.
   Be creative and match the emoji to the context when possible.
   ```
4. Schedule: Every 10 minutes (`*/10 * * * *`)
5. Result: Super Agent ID `d78c7a18-bc22-4986-a7c7-27a34fcd1bf3` with Schedule ID `sched_7m1vpinxmsjwww3bzn8kh`

#### Modifying Super Agent Schedules

When you need to change a super agent's schedule (cron expression, timezone, etc.), it's best to delete and recreate the schedule in Trigger.dev rather than trying to update it:

1. Delete the existing schedule from Trigger.dev
2. Create a new schedule with the updated parameters
3. Update the super agent with the new schedule ID

**IMPORTANT**: Always delete and recreate schedules instead of updating them to avoid potential issues with schedule synchronization.

#### Removing Super Agents

To completely remove a super agent, you must delete it from both Trigger.dev and the database:

**1. List all super agents to find the schedule IDs:**

```sql
SELECT id, name, schedule_id FROM super_agents
```

**2. Delete schedules from Trigger.dev:**

```bash
curl -X DELETE https://api.trigger.dev/api/v1/schedules/<schedule_id> \
  -H "Authorization: Bearer <TRIGGER_SECRET_KEY>"
```

**3. Delete super agents from database:**

```sql
-- Delete a specific super agent
DELETE FROM super_agents WHERE id = '<superAgentId>' RETURNING id, name

-- Or delete all super agents
DELETE FROM super_agents RETURNING id, name
```

**Note**: Always delete from Trigger.dev first, then from the database to avoid orphaned schedules.

#### Troubleshooting

- **Missing API Key**: Check `apps/web/.env` for `TRIGGER_SECRET_KEY`
- **Schedule Not Running**: Verify the schedule is active in Trigger.dev dashboard
- **No Tasks Executing**: Ensure there are active chats for the associated agent
- **Permission Errors**: Verify the API key matches the environment (dev vs prod)

### Python Super Agents (Legacy)

**⚠️ This section is for reference only. For new super agents, use the Web Environment (above).**

The Python FastAPI backend has a legacy super agent system built into the agent classes:

**Architecture:**

- Agents inherit from `BaseAgent[TConfig]` which provides super agent functionality
- Each agent can implement `on_super_agent_call()` to define autonomous behavior
- Agents return a `SuperAgentConfig` via `super_agent_config()` to enable scheduling
- APScheduler handles the scheduling within the FastAPI application

**Key Files:**

- `apps/api/src/agents/base_agent.py` - Base agent class with super agent support
- `apps/api/src/agents/tools/base_tools.py` - Contains `tool_call_super_agent()` tool

**How It Works:**

1. Agent defines `super_agent_config()` with cron expression
2. APScheduler triggers the agent's `run_super_agent()` method
3. Agent can use `tool_call_super_agent()` to trigger its own super agent behavior
4. The `on_super_agent_call()` method handles the autonomous logic

**Limitations:**

- Runs only on the FastAPI server (no distributed execution)
- Harder to configure and manage than web environment
- Requires server restart to update schedules
- Limited observability compared to Trigger.dev

**When to Use:**

- Only when maintaining existing Python agent super agent functionality
- When the super agent logic is tightly coupled to Python-specific tools
- For debugging or testing agent behavior locally

### Tool Categories

- **EasyLog Backend Tools** - Company/user/project management API access
- **EasyLog SQL Tools** - Database queries via SSH tunnel
- **Knowledge Graph Tools** - Document search and retrieval
- **Visualization Tools** - Chart creation (bar, line, ZLM healthcare charts)
- **Communication Tools** - OneSignal notifications, multiple choice widgets
- **System Tools** - Memory, reminders, recurring tasks, file operations

## Development Guidelines

### Code Style

- Python: Ruff for linting and formatting (line-length = 120)
- Async/await patterns throughout
- Type hints required (except in tests and **init**.py files)
- Comprehensive error handling and logging

### Testing

```bash
cd apps/api
uv run pytest                    # Run all tests
uv run pytest tests/api/         # Run API tests
uv run pytest -v                # Verbose output
```

### Database Migrations

```bash
cd apps/api
uv run prisma db push           # Push schema changes
uv run prisma generate          # Regenerate Prisma client
```

### Environment Setup

- Copy `apps/api/.env.example` to `apps/api/.env` and configure:
  - `API_SECRET_KEY` - Required for API authentication
  - `OPENROUTER_API_KEY` - OpenRouter.ai API access
  - `NEO4J_*` - Neo4j connection for knowledge graph
  - Database connection strings
  - External service API keys

## Multi-Tenant Architecture

The system supports multiple client configurations with:

- Client-specific agent configurations in JSON files (`apps/api/src/agents/implementations/json/`)
- Role-based tool access and permissions
- Customizable AI model selection per client
- HIPAA/GDPR compliance capabilities for healthcare clients
- Performance optimization through model routing

## Important Notes

**Server Access Policy**: Never make changes to the production server without explicit approval. Only use read-only monitoring commands like viewing logs.

**Client Solutions**: The platform builds different solutions for different clients (healthcare, e-commerce, financial, customer service) with industry-specific tools and compliance requirements.

**Security**: All API requests require `X-API-KEY` header authentication. Client data access uses proper authorization and role-based permissions.

**Documentation References**: See `.cursorrules` for detailed development context and `instructions/` directory for client configuration guides.
