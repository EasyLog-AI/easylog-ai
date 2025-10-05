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
- Super agents run autonomously on configurable intervals for background tasks
- OpenRouter.ai integration for access to 300+ AI models

**Key Integrations**

- **Database**: Prisma ORM with PostgreSQL
- **Vector Search**: Weaviate for document embeddings and knowledge retrieval
- **Knowledge Graph**: Neo4j via Graphiti for relationship mapping
- **AI Models**: OpenRouter.ai for model routing (Claude, GPT-4, etc.)
- **Notifications**: OneSignal for push notifications
- **Scheduling**: APScheduler for background jobs

### Agent Implementations

- `easylog_agent.py` - Production agent with comprehensive tools (3-hour super agent)
- `mumc_agent.py` - Healthcare/COPD-focused agent with ZLM charts
- `debug_agent.py` - Development agent with enhanced logging (2-hour super agent)
- `rick_thropic_agent.py` - Personal assistant agent

### Creating New Super Agents

Super agents are autonomous AI agents that run on scheduled intervals to perform background tasks. They operate on existing user chats and can send messages, analyze data, and perform automated actions.

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

- **Task Reference**: The schedule always uses `dispatch-super-agents` as the task ID. This task:
  - Finds the super agent by `externalId`
  - Gets all user chats for the associated agent
  - Dispatches individual jobs for each user's latest chat

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

#### Troubleshooting

- **Missing API Key**: Check `apps/web/.env` for `TRIGGER_SECRET_KEY`
- **Schedule Not Running**: Verify the schedule is active in Trigger.dev dashboard
- **No Tasks Executing**: Ensure there are active chats for the associated agent
- **Permission Errors**: Verify the API key matches the environment (dev vs prod)

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
