-- Migration: Add agent_id to memories table
-- Date: 2025-11-01
-- Description: Make memories agent-specific instead of global per user

-- Add agent_id column (nullable first to allow existing data)
ALTER TABLE memories 
ADD COLUMN agent_id UUID;

-- Add foreign key constraint
ALTER TABLE memories 
ADD CONSTRAINT memories_agent_id_fkey 
FOREIGN KEY (agent_id) 
REFERENCES agents(id) 
ON DELETE CASCADE;

-- For existing memories, you need to manually assign them to an agent
-- or delete them if they cannot be assigned.
-- 
-- Example to assign all existing memories to a specific agent:
-- UPDATE memories SET agent_id = 'your-agent-id-here' WHERE agent_id IS NULL;
-- 
-- Or to delete all existing memories without an agent:
-- DELETE FROM memories WHERE agent_id IS NULL;

-- After assigning agent_ids to all existing memories, make the column required:
-- ALTER TABLE memories ALTER COLUMN agent_id SET NOT NULL;

