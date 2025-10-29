import { tool } from 'ai';
import { and, eq, exists, not, or } from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/pg-core';

import db from '@/database/client';
import { documentAgents, documentRoles, documents } from '@/database/schema';

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

      // Agent access: no associations OR current agent has access
      const agentAccessClause = or(
        not(
          exists(
            qb
              .select()
              .from(documentAgents)
              .where(eq(documentAgents.documentId, documents.id))
          )
        ),
        exists(
          qb
            .select()
            .from(documentAgents)
            .where(
              and(
                eq(documentAgents.documentId, documents.id),
                eq(documentAgents.agentId, agentId)
              )
            )
        )
      );

      // Role access: no restrictions OR current role has access
      const roleAccessClause = roleId
        ? or(
            not(
              exists(
                qb
                  .select()
                  .from(documentRoles)
                  .where(eq(documentRoles.documentId, documents.id))
              )
            ),
            exists(
              qb
                .select()
                .from(documentRoles)
                .where(
                  and(
                    eq(documentRoles.documentId, documents.id),
                    eq(documentRoles.roleId, roleId)
                  )
                )
            )
          )
        : undefined;

      const whereClause = and(
        roleAccessClause
          ? and(agentAccessClause, roleAccessClause)
          : agentAccessClause,
        eq(documents.id, documentId)
      );

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
        throw new Error('Document not found');
      }

      return JSON.stringify(documentResult[0]);
    }
  });
};

export default getToolLoadDocument;
