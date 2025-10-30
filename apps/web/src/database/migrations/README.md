# Database Migrations

## Migration 0001: Add agent_id to memories table

### Problem
Memories were shared across all agents for a user, causing irrelevant memories to appear in different agent contexts (e.g., Heuvelgroep-specific memories showing up in Easylog agent).

### Solution
Add `agent_id` foreign key to `memories` table to make memories agent-specific.

### Code Changes
1. **Database schema** (`schema.ts`): Added `agentId` column with foreign key to `agents` table
2. **Relations** (`relations.ts`): Added bidirectional relation between `memories` and `agents`
3. **toolCreateMemory**: Now requires and stores `agentId` parameter
4. **toolDeleteMemory**: Added security check to only delete memories for correct agent
5. **getCurrentUser**: Added optional `agentId` parameter to filter memories by agent
6. **Chat route**: Pass `agentId` to getCurrentUser and memory tools

### Migration Steps

#### For Development/Staging (Neon Database: still-wind-33703124)

**Option 1: Clean slate (if memories can be deleted)**
```sql
-- Delete all existing memories
DELETE FROM memories;

-- Run the migration
-- Then push the updated schema
```

**Option 2: Assign existing memories to an agent**
```sql
-- First, find which agents users have been chatting with
SELECT DISTINCT 
  m.user_id, 
  c.agent_id, 
  a.name as agent_name,
  COUNT(m.id) as memory_count
FROM memories m
JOIN chats c ON c.user_id = m.user_id
JOIN agents a ON a.id = c.agent_id
GROUP BY m.user_id, c.agent_id, a.name;

-- If a user has only chatted with one agent, assign all their memories to that agent
-- If a user has chatted with multiple agents, you need to decide which agent owns each memory

-- Example: Assign all memories to the user's most-used agent
UPDATE memories m
SET agent_id = (
  SELECT c.agent_id 
  FROM chats c 
  WHERE c.user_id = m.user_id 
  GROUP BY c.agent_id 
  ORDER BY COUNT(*) DESC 
  LIMIT 1
)
WHERE agent_id IS NULL;

-- Verify all memories have an agent_id
SELECT COUNT(*) FROM memories WHERE agent_id IS NULL;
-- Should return 0

-- Make column required
ALTER TABLE memories ALTER COLUMN agent_id SET NOT NULL;
```

#### Execution Order
1. **Deploy code changes** (this PR)
2. **Run migration SQL** on Neon database via MCP or Neon Console
3. **Assign agent_ids** to existing memories (choose option 1 or 2 above)
4. **Make column NOT NULL** (if using option 2)
5. **Test** that memories are agent-specific

### Testing
1. Create a memory in Agent A
2. Switch to Agent B
3. Verify the memory from Agent A is NOT shown in Agent B's context
4. Create a new memory in Agent B
5. Switch back to Agent A
6. Verify Agent A still has its own memory, but not Agent B's memory

### Rollback
If you need to rollback:
```sql
ALTER TABLE memories DROP CONSTRAINT memories_agent_id_fkey;
ALTER TABLE memories DROP COLUMN agent_id;
```

Then revert the code changes.

