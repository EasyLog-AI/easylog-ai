import { and, eq } from 'drizzle-orm';

import db from '@/database/client';
import { documentAgents, documentRoles } from '@/database/schema';

export interface CheckDocumentAccessParams {
  documentId: string;
  agentId: string;
  roleId?: string;
}

/**
 * Check if a document is accessible by a specific agent and role
 *
 * Logic:
 * - If document has NO agent associations, it's accessible by all agents
 * - If document has NO role restrictions, it's accessible by all roles
 * - Otherwise, check for explicit access
 *
 * @param params - Document access parameters
 * @returns True if access is granted, false otherwise
 *
 * @example
 *   const hasAccess = await checkDocumentAccess({
 *     documentId: 'doc-123',
 *     agentId: 'agent-456',
 *     roleId: 'role-789'
 *   });
 */
const checkDocumentAccess = async ({
  documentId,
  agentId,
  roleId
}: CheckDocumentAccessParams) => {
  // Check if document has any agent associations
  const anyAgentAssociation = await db.query.documentAgents.findFirst({
    where: eq(documentAgents.documentId, documentId)
  });

  // If no agent associations exist, document is accessible by all agents
  if (!anyAgentAssociation) {
    // Still need to check role restrictions if roleId is provided
    if (roleId) {
      const anyRoleRestriction = await db.query.documentRoles.findFirst({
        where: eq(documentRoles.documentId, documentId)
      });

      // If no role restrictions, accessible by all roles
      if (!anyRoleRestriction) return true;

      // Check if specific role has access
      const roleAccess = await db.query.documentRoles.findFirst({
        where: and(
          eq(documentRoles.documentId, documentId),
          eq(documentRoles.roleId, roleId)
        )
      });

      return !!roleAccess;
    }

    return true;
  }

  // Document has agent associations - check if current agent has access
  const agentAccess = await db.query.documentAgents.findFirst({
    where: and(
      eq(documentAgents.documentId, documentId),
      eq(documentAgents.agentId, agentId)
    )
  });

  if (!agentAccess) return false;

  // Agent has access - now check role restrictions if roleId is provided
  if (!roleId) return true;

  const anyRoleRestriction = await db.query.documentRoles.findFirst({
    where: eq(documentRoles.documentId, documentId)
  });

  // If no role restrictions exist, all roles can access
  if (!anyRoleRestriction) return true;

  // Check if specific role has access
  const roleAccess = await db.query.documentRoles.findFirst({
    where: and(
      eq(documentRoles.documentId, documentId),
      eq(documentRoles.roleId, roleId)
    )
  });

  return !!roleAccess;
};

export default checkDocumentAccess;
