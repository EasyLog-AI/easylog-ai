import { UIMessageStreamWriter, tool } from 'ai';
import { and, eq, exists, isNull, or } from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/pg-core';
import { v4 as uuidv4 } from 'uuid';

import db from '@/database/client';
import { documentRoleAccess, documents } from '@/database/schema';

import { loadDocumentConfig } from './config';

interface ToolLoadDocumentProps {
  agentId: string;
  roleId?: string;
}

const getToolLoadDocument = (
  { agentId, roleId }: ToolLoadDocumentProps,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...loadDocumentConfig,
    execute: async ({ documentId }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Document laden...'
        }
      });

      try {
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
          messageStreamWriter?.write({
            type: 'data-executing-tool',
            id,
            data: {
              status: 'error',
              message: 'Document niet gevonden of geen toegang'
            }
          });
          return 'Document not found or access denied';
        }

        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'completed',
            message: 'Document geladen'
          }
        });

        return JSON.stringify(documentResult[0], null, 2);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        console.error('[toolLoadDocument] Error loading document', {
          agentId,
          roleId,
          documentId,
          error
        });
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: `Fout bij laden van document: ${message}`
          }
        });
        return `Error loading document: ${message}`;
      }
    }
  });
};

export default getToolLoadDocument;
