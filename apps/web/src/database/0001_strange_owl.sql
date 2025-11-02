-- Migration 0001: Add agent_id to memories table
--
-- Problem: Memories were shared across all agents for a user, causing irrelevant
-- memories to appear in different agent contexts.
--
-- Solution: Add agent_id foreign key to memories table to make memories agent-specific.

-- Step 1: Add agent_id column as nullable
ALTER TABLE "memories" ADD COLUMN "agent_id" uuid;--> statement-breakpoint

-- Step 2: Populate agent_id for existing memories
-- Assign each user's memories to their most-used agent (agent with most chats)
UPDATE "memories" m
SET "agent_id" = (
  SELECT c."agent_id"
  FROM "chats" c
  WHERE c."user_id" = m."user_id"
  GROUP BY c."agent_id"
  ORDER BY COUNT(*) DESC
  LIMIT 1
)
WHERE "agent_id" IS NULL;--> statement-breakpoint

-- Step 3: Delete any orphaned memories (users with no chats)
-- These memories cannot be assigned to an agent
DELETE FROM "memories" WHERE "agent_id" IS NULL;--> statement-breakpoint

-- Step 4: Make column NOT NULL after data is populated
ALTER TABLE "memories" ALTER COLUMN "agent_id" SET NOT NULL;--> statement-breakpoint

-- Step 5: Add foreign key constraint
ALTER TABLE "memories" ADD CONSTRAINT "memories_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Verification query (optional - comment out for actual migration):
-- SELECT
--   COUNT(*) as total_memories,
--   COUNT(DISTINCT agent_id) as agents_with_memories,
--   COUNT(CASE WHEN agent_id IS NULL THEN 1 END) as orphaned_memories
-- FROM memories;

-- Rollback instructions:
-- ALTER TABLE "memories" DROP CONSTRAINT "memories_agent_id_agents_id_fk";
-- ALTER TABLE "memories" DROP COLUMN "agent_id";
