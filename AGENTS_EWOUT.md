# Repository Guidelines

## Project Structure & Module Organization

This pnpm/turbo monorepo hosts two major surfaces. `apps/api/src` contains the FastAPI backend, split into `agents`, `api`, `services`, `lib`, and `models`; experiments and notebooks sit under `apps/api/experiments`, while mirrored tests live in `apps/api/tests`. `apps/web/src` covers the Next.js dashboard, Trigger.dev jobs inside `src/jobs`, reusable UI in `src/components`, and utility libraries in `src/lib`. Legacy Python agent prototypes remain in the repository root (`agents/`)—treat them as reference when designing new flows for `apps/api/src/agents` or `apps/web/src/jobs/super-agent`.

## Build, Test, and Development Commands

Run `pnpm run dev` to start backend and frontend services via Turbo. Build all workspaces with `pnpm run build`, lint with `pnpm run lint`, and format using `pnpm run format`. For API-only workflows, switch to `apps/api` and execute `uv sync && uv run fastapi dev ./src/main.py`; refresh the Prisma schema through `uv run prisma db push`. Frontend teams can run `pnpm --filter web dev` and pair Trigger.dev locally with `pnpm --filter web run trigger:dev`.

## Coding Style & Naming Conventions

Python code follows Ruff (line length 120, strict annotations) and 4-space indentation—keep module names snake_case and prefer explicit imports outside `__init__.py`. TypeScript code adheres to Next.js ESLint + Prettier with the Tailwind plugin, camelCase variables, and PascalCase React components. Tailwind classes are auto-sorted; run `pnpm run format` before pushing to align shared files.

## Testing Guidelines

Backend tests rely on Pytest; execute `uv run pytest` or scope with `uv run pytest tests/api`. Place new suites alongside implementation modules and name them `test_<feature>.py`. The web app uses Vitest: run `pnpm --filter web test` and co-locate `.test.ts` files with sources (e.g., `process-xml-data.test.ts`). Document any manual validation in PRs when automated coverage is impractical.

## Commit & Pull Request Guidelines

Stick to the conventional/emoji hybrid visible in history—examples: `feat(agents): add scratchpad sync`, `🐛 fix: address reflection client`. Keep commits behavior-focused and scoped for review. Pull requests should include a concise summary, linked issue, testing notes (`pnpm run lint`, `uv run pytest`, etc.), and UI screenshots if visuals changed.

## Security & Configuration Notes

Use `.env.example` files in `apps/api` and `apps/web` as templates; never commit real keys. Confirm database migrations with `uv run prisma db push` and keep Trigger.dev schedules in Amsterdam time per `apps/web/src/jobs/super-agent` guidance. Reference `AGENTS.md` for deeper context on super-agent workflows and legacy automation paths.
