import { eq, sql } from 'drizzle-orm';

import db from '@/database/client';
import { agentRoles, documentAgents, documentRoles } from '@/database/schema';

/**
 * Migrate existing documents from single-agent to multi-agent/multi-role access
 *
 * This migration:
 * 1. Creates document_agents entries for all existing documents
 * 2. Creates document_roles entries for all roles in each document's agent
 * 3. Preserves existing access patterns (all roles get access to all documents)
 *
 * Note: Run this BEFORE pushing the schema changes that remove agentId
 *
 * @example
 *   await migrateDocumentsToMultiAccess();
 */
const migrateDocumentsToMultiAccess = async () => {
  console.log('Starting document migration...');

  // Step 1: Get all existing documents with agentId (using raw SQL since schema is updated)
  const existingDocuments = await db.execute<{
    id: string;
    agent_id: string | null;
  }>(sql`SELECT id, agent_id FROM documents`);

  console.log(`Found ${existingDocuments.rows.length} documents to migrate`);

  // Step 2: Create document_agents entries
  const documentAgentEntries = existingDocuments.rows
    .filter((doc) => doc.agent_id)
    .map((doc) => ({
      documentId: doc.id,
      agentId: doc.agent_id!
    }));

  if (documentAgentEntries.length > 0) {
    await db.insert(documentAgents).values(documentAgentEntries);
    console.log(`Created ${documentAgentEntries.length} document-agent relationships`);
  }

  // Step 3: Get all roles for each agent and create document_roles entries
  const documentRoleEntries = [];

  for (const doc of existingDocuments.rows) {
    if (!doc.agent_id) continue;

    const roles = await db.query.agentRoles.findMany({
      where: eq(agentRoles.agentId, doc.agent_id)
    });

    for (const role of roles) {
      documentRoleEntries.push({
        documentId: doc.id,
        roleId: role.id
      });
    }
  }

  if (documentRoleEntries.length > 0) {
    await db.insert(documentRoles).values(documentRoleEntries);
    console.log(`Created ${documentRoleEntries.length} document-role relationships`);
  }

  console.log('Migration complete!');
  console.log('Next steps:');
  console.log('1. Verify the migration worked correctly');
  console.log('2. Push the schema changes (this will drop the agent_id column)');
  console.log('3. Verify documents are still accessible');
};

export default migrateDocumentsToMultiAccess;
