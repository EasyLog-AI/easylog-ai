import { and, eq, exists, not, or, SQL } from 'drizzle-orm';

import db from '@/database/client';
import { documentAgents, documentRoles, documents } from '@/database/schema';

export interface GetAccessibleDocumentsWhereParams {
  agentId: string;
  roleId?: string;
}

/**
 * Build a Drizzle where clause for documents accessible by agent/role
 *
 * @param params - Agent and role identifiers
 * @returns SQL where clause for Drizzle queries
 *
 * @example
 *   const whereClause = getAccessibleDocumentsWhere({
 *     agentId: 'agent-123',
 *     roleId: 'role-456'
 *   });
 *   const docs = await db.query.documents.findMany({ where: whereClause });
 */
const getAccessibleDocumentsWhere = ({
  agentId,
  roleId
}: GetAccessibleDocumentsWhereParams): SQL => {
  const agentAccessCondition = exists(
    db
      .select()
      .from(documentAgents)
      .where(
        and(
          eq(documentAgents.documentId, documents.id),
          eq(documentAgents.agentId, agentId)
        )
      )
  );

  // If no roleId, only check agent access
  if (!roleId) {
    return agentAccessCondition;
  }

  // Check if document has no role restrictions OR role has explicit access
  const roleAccessCondition = or(
    // No role restrictions (accessible by all roles)
    not(
      exists(
        db
          .select()
          .from(documentRoles)
          .where(eq(documentRoles.documentId, documents.id))
      )
    ),
    // OR active role has explicit access
    exists(
      db
        .select()
        .from(documentRoles)
        .where(
          and(
            eq(documentRoles.documentId, documents.id),
            eq(documentRoles.roleId, roleId)
          )
        )
    )
  );

  return and(agentAccessCondition, roleAccessCondition);
};

export default getAccessibleDocumentsWhere;
