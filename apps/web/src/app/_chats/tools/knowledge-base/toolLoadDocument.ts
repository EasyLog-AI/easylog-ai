import { tool } from 'ai';
import { and, eq, exists, isNull, or } from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/pg-core';

import db from '@/database/client';
import { documentRoleAccess, documents } from '@/database/schema';

import { loadDocumentConfig } from './config';

interface ToolLoadDocumentProps {
  agentId: string;
  roleId?: string;
}

const getToolLoadDocument = ({ agentId, roleId }: ToolLoadDocumentProps) => {
  return tool({
    ...loadDocumentConfig,
    execute: async ({ documentId }) => {
      const qb = new QueryBuilder();

      // Access control: documents must belong to the agent AND (have "all roles" access OR specific role has access)
      const accessClause = and(
        eq(documents.agentId, agentId),
        or(
          // Document has "all roles" access (agentRoleId IS NULL in documentRoleAccess)
          exists(
            qb
              .select()
              .from(documentRoleAccess)
              .where(
                and(
                  eq(documentRoleAccess.documentId, documents.id),
                  isNull(documentRoleAccess.agentRoleId)
                )
              )
          ),
          // Document has specific role access
          roleId
            ? exists(
                qb
                  .select()
                  .from(documentRoleAccess)
                  .where(
                    and(
                      eq(documentRoleAccess.documentId, documents.id),
                      eq(documentRoleAccess.agentRoleId, roleId)
                    )
                  )
              )
            : undefined
        )
      );

      const whereClause = and(accessClause, eq(documents.id, documentId));

      const documentResult = await db
        .select({
          id: documents.id,
          name: documents.name,
          summary: documents.summary,
          tags: documents.tags
        })
        .from(documents)
        .where(whereClause)
        .limit(1);

      if (!documentResult.length) {
        throw new Error('Document not found or access denied');
      }

      return JSON.stringify(documentResult[0]);
    }
  });
};

export default getToolLoadDocument;
