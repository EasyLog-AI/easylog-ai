import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, generateText, stepCountIs, tool } from 'ai';
import { and, eq, exists, isNull, or } from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/pg-core';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import db from '@/database/client';
import { documentRoleAccess, documents } from '@/database/schema';
import openrouterProvider from '@/lib/ai-providers/openrouter';
import tryCatch from '@/utils/try-catch';

import { researchDocumentConfig } from './config';

interface ToolResearchDocumentProps {
  agentId: string;
  roleId?: string;
}

const getToolResearchDocument = (
  { agentId, roleId }: ToolResearchDocumentProps,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...researchDocumentConfig,
    execute: async ({ documentId, question }) => {
      const id = uuidv4();
      const qb = new QueryBuilder();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: `Searching document content for: "${question}"`
        }
      });

      // Verify document access
      const accessClause = and(
        eq(documents.id, documentId),
        eq(documents.agentId, agentId),
        or(
          // Document has "all roles" access
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

      const [dbDocument] = await db
        .select()
        .from(documents)
        .where(accessClause)
        .limit(1);

      if (!dbDocument) {
        const errorMessage = 'Document not found or access denied';
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'completed',
            message: `Document not found or access denied`
          }
        });
        return errorMessage;
      }

      // Create recursive agent with SQL tool to research the document
      const { text } = await generateText({
        model: openrouterProvider('google/gemini-2.5-flash'),
        tools: {
          toolExecuteSQL: tool({
            description:
              'Execute a SQL query on the Easylog database to extract document data',
            inputSchema: z.object({
              query: z.string().describe('The SQL query to execute')
            }),
            execute: async ({ query }) => {
              console.log('Executing SQL query:', query);

              const [result, error] = await tryCatch(db.execute(query));

              if (error) {
                Sentry.captureException(error);
                console.error(error);
                return `Error executing SQL query: ${error.message}`;
              }

              return JSON.stringify(result, null, 2);
            }
          })
        },
        messages: [
          {
            role: 'system',
            content: `You are a document research assistant. Your task is to answer the user's question using the provided document data.

You have access to toolExecuteSQL to query the document_data table. Use this tool recursively to extract relevant information.

The document_data table structure:
- id: UUID (primary key)
- document_id: UUID (foreign key to documents table)
- part_name: TEXT (document section/part)
- row_id: INTEGER (row number within document)
- row_data: JSONB (contains all row data as JSON objects)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

The row_data column contains JSON objects where each key is a column name and the value is the corresponding data. For example:
{
  "Column1": "value1",
  "Column2": 123,
  "Column3": "2024-01-01",
  "Column4": true
}

Document Information:
- Document ID: ${dbDocument.id}
- Document Name: ${dbDocument.name}
- Document Summary: ${dbDocument.summary || 'N/A'}

Document Structure Analysis:
${JSON.stringify(dbDocument.analysis, null, 2)}

QUERY STRATEGY:
1. ALWAYS prioritize aggregate functions (COUNT, SUM, AVG, MIN, MAX) for overview information
2. Only use detailed row-by-row queries (LIMIT 25) if the user explicitly asks for specific examples
3. Start with summary statistics and trends rather than individual records
4. Use aggregate queries to understand data distribution and patterns
5. Focus on columns that seem most relevant to the question
6. Make multiple queries if needed to build a complete answer

Example aggregate queries:
- "SELECT COUNT(*) as total_rows FROM document_data WHERE document_id = '${dbDocument.id}'"
- "SELECT row_data->>'ColumnName' as value, COUNT(*) FROM document_data WHERE document_id = '${dbDocument.id}' GROUP BY value ORDER BY COUNT(*) DESC LIMIT 10"
- "SELECT AVG((row_data->>'NumericColumn')::numeric) as average FROM document_data WHERE document_id = '${dbDocument.id}'"

Return only the answer to the user's question as plain text. Be concise and direct.`
          },
          {
            role: 'user',
            content: question
          }
        ],
        stopWhen: stepCountIs(10)
      });

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: `Finished analyzing "${dbDocument.name}"`
        }
      });

      return text;
    }
  });
};

export default getToolResearchDocument;
