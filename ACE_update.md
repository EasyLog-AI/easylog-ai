# ACE Solution Overview

## High-Level Workflow

- **Generator (agent runtime)** responds to chat input using the current ACE playbook injected into the system prompt.
- **Instrumentation** forces the model to cite any playbook rule it applies (`[ACE:<id>]`), attach an `ACE_USED:` summary line, and propagate bullet IDs through tool calls via an `ace_used_bullets` argument.
- **Telemetry capture** hooks in both streaming and completion paths read these markers and hand bullet usage to the learning loop.
- **Reflector** (LLM or rule-based) analyzes each tool execution, tagging referenced bullets as helpful/harmful and proposing a concise corrective insight when errors appear.
- **Curator** decides whether to add, skip, merge, or update bullets based on the reflection, backed by embedding similarity checks to avoid duplicates.
- **Playbook storage** persists the evolving rule set in `apps/api/src/agents/implementations/data/mumc_ace_playbook.json`, tracking helpful/harmful counts, embeddings, and versioning.

## Playbook Structure

- Every bullet (`PlaybookBullet`) stores ID, section, helpful/harmful tallies, timestamps, and an optional embedding vector.
- Bullets are grouped into fixed sections (`strategies_and_hard_rules`, `data_interpretation`, `user_interaction`, `tool_usage`, `common_mistakes`, `health_signals`, `factual_verification`).
- Formatting logic produces a compact prompt appendix listing bullets as `[mumc-001:↑3↓0] Always validate ZLM data…`.

## Telemetry & Usage Tracking

- Inline citations and `ACE_USED:` lines ensure message-level coverage; tool handlers backfill usage when the LLM omits references by falling back to keyword heuristics.
- Bullet IDs gathered during tool calls are passed into `ace_process_tool_execution`, so scoring reflects actual usage rather than inferred intent.
- Successful tool runs increment helpful counts on referenced bullets; failures mark them harmful and trigger deeper reflection.

## Reflection & Multi-Epoch Curation

- `ace_process_tool_execution` resolves bullet IDs against the current playbook, invokes the reflector, and stores reflections in an in-memory buffer.
- A multi-epoch replay loop re-curates stored reflections (up to two extra passes) after playbook updates, providing the “grow and refine” behavior described in the ACE paper.
- Curator operations support `ADD`, `UPDATE`, and implicit `SKIP`, allowing both new bullets and upgrades of existing guidance.

## Embedding-Based Hygiene

- Configurable embedding model (`ACEConfig.embedding_model`, default `text-embedding-3-small`) generates vectors for new insights and existing bullets.
- Duplicate and similarity checks prevent redundant bullets and enable targeted harmful tagging when quality issues resemble prior knowledge.
- Caches avoid recomputing embeddings for identical strings within a session.

## Conversational Quality Monitoring (ACE v2.0)

- Optional quality evaluator samples assistant replies (`always`, `sample_10%`, `sample_25%`, `critical_only`) to detect factual errors and missed health signals.
- Quality reports produce structured issues; similar bullets are marked harmful and new remediation bullets are curated automatically.
- Playbook updates from quality checks go through the same curator pipeline, keeping all ACE learning in one channel.

## Configuration & Storage

- Key knobs live in `ACEConfig`: maximum bullets, pruning thresholds, reflection and quality models, embedding similarity cutoff, and logging toggles.
- Playbook writes occur atomically with pruning when thresholds are exceeded, keeping the prompt within manageable size.
- The solution currently stores data per agent instance on disk; migrate to shared storage if multi-replica deployment is required.

## Operational Considerations

- Ensure the chosen model honors the instrumentation instructions; fallback heuristics exist but degrade scoring accuracy.
- Embedding calls increase latency slightly; monitor OpenAI rate limits when running high-volume workloads.
- Multi-epoch replays run synchronously after each error reflection—keep an eye on execution time as the reflection buffer grows.
