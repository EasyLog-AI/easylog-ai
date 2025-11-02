-- Migration 0002: Add default document access for existing documents
--
-- Problem: Existing documents may not have any document_role_access entries,
-- potentially making them inaccessible to agent roles.
--
-- Solution: Insert a document_role_access row for each existing document with
-- agent_role_id = NULL, which grants access to all roles of that document's agent.

-- Insert document access rows for documents that don't have any access entries yet
-- Using NULL agent_role_id means "accessible to all roles"
INSERT INTO "document_role_access" ("document_id", "agent_role_id", "created_at", "updated_at")
SELECT
  d.id,
  NULL,
  NOW(),
  NOW()
FROM "documents" d
WHERE NOT EXISTS (
  SELECT 1
  FROM "document_role_access" dra
  WHERE dra.document_id = d.id
);--> statement-breakpoint

-- Verification query (optional - comment out for actual migration):
-- SELECT
--   d.id as document_id,
--   d.name as document_name,
--   COUNT(dra.id) as access_entries
-- FROM documents d
-- LEFT JOIN document_role_access dra ON dra.document_id = d.id
-- GROUP BY d.id, d.name
-- ORDER BY d.created_at DESC;

-- Rollback instructions:
-- DELETE FROM "document_role_access" WHERE "agent_role_id" IS NULL;
