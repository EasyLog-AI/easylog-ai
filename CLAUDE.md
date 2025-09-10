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
- Type hints required (except in tests and __init__.py files)
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