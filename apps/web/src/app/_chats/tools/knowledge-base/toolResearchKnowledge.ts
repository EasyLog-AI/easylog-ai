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

import { researchKnowledgeConfig } from './config';

interface ToolResearchKnowledgeProps {
  agentId: string;
  roleId?: string;
  streamWriterId?: string;
}

const getToolResearchKnowledge = (
  { agentId, roleId, streamWriterId }: ToolResearchKnowledgeProps,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...researchKnowledgeConfig,
    execute: async ({ knowledgeIds, question }) => {
      const id = streamWriterId ?? uuidv4();
      const qb = new QueryBuilder();

      const documentCount = knowledgeIds.length;
      const pluralSuffix = documentCount > 1 ? 's' : '';
      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: `Doorzoeken van ${documentCount} kennisitem${pluralSuffix} voor: "${question}"`
        }
      });

      // Verify knowledge access for all provided documents
      const dbKnowledgeList = [];
      for (const knowledgeId of knowledgeIds) {
        const accessClause = and(
          eq(documents.id, knowledgeId),
          eq(documents.agentId, agentId),
          or(
            // Knowledge has "all roles" access
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
            // Knowledge has specific role access
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

        const [dbKnowledge] = await db
          .select()
          .from(documents)
          .where(accessClause)
          .limit(1);

        if (!dbKnowledge) {
          const errorMessage = `Kennisitem ${knowledgeId} niet gevonden of toegang geweigerd`;
          messageStreamWriter?.write({
            type: 'data-executing-tool',
            id,
            data: {
              status: 'error',
              message: errorMessage
            }
          });
          return errorMessage;
        }

        dbKnowledgeList.push(dbKnowledge);
      }

      if (dbKnowledgeList.length === 0) {
        const errorMessage = 'Geen kennisitems gevonden of toegang geweigerd';
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: errorMessage
          }
        });
        return errorMessage;
      }

      // Create recursive agent with SQL tool to research the knowledge
      const { text } = await generateText({
        model: openrouterProvider('google/gemini-2.5-flash'),
        tools: {
          toolExecuteSQL: tool({
            description:
              'Execute a SQL query on the Easylog database to extract knowledge data',
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
            content: `You are a knowledge research assistant. Your task is to answer the user's question using the provided knowledge data from ${documentCount} document${pluralSuffix}.

You have access to toolExecuteSQL to query the document_data table. Use this tool recursively to extract relevant information.

The document_data table structure:
- id: UUID (primary key)
- document_id: UUID (foreign key to documents table)
- part_name: TEXT (knowledge section/part)
- row_id: INTEGER (row number)
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

AVAILABLE KNOWLEDGE DOCUMENTS (${documentCount}):
${dbKnowledgeList
  .map(
    (doc, idx) => `
Document ${idx + 1}:
- ID: ${doc.id}
- Name: ${doc.name}
- Summary: ${doc.summary || 'N/A'}
- Structure Analysis:
${JSON.stringify(doc.analysis, null, 2)}
`
  )
  .join('\n')}

QUERY STRATEGY:
1. ALWAYS prioritize aggregate functions (COUNT, SUM, AVG, MIN, MAX) for overview information
2. Only use detailed row-by-row queries (LIMIT 25) if the user explicitly asks for specific examples
3. Start with summary statistics and trends rather than individual records
4. Use aggregate queries to understand data distribution and patterns
5. Focus on columns that seem most relevant to the question
6. Make multiple queries if needed to build a complete answer
7. When working with multiple documents, use IN clauses or UNION queries to compare/correlate data

Example queries for single document:
- "SELECT COUNT(*) as total_rows FROM document_data WHERE document_id = '${dbKnowledgeList[0].id}'"
- "SELECT row_data->>'ColumnName' as value, COUNT(*) FROM document_data WHERE document_id = '${dbKnowledgeList[0].id}' GROUP BY value ORDER BY COUNT(*) DESC LIMIT 10"
- "SELECT AVG((row_data->>'NumericColumn')::numeric) as average FROM document_data WHERE document_id = '${dbKnowledgeList[0].id}'"

${
  documentCount > 1
    ? `
Example queries for multiple documents (correlation and comparison):
- "SELECT document_id, COUNT(*) as total_rows FROM document_data WHERE document_id IN (${dbKnowledgeList.map((d) => `'${d.id}'`).join(', ')}) GROUP BY document_id"
- "SELECT row_data->>'CommonColumn' as value, COUNT(*) as total FROM document_data WHERE document_id IN (${dbKnowledgeList.map((d) => `'${d.id}'`).join(', ')}) GROUP BY value ORDER BY total DESC LIMIT 10"
- "SELECT d1.row_data->>'Key1' as key1, d2.row_data->>'Key2' as key2 FROM document_data d1 JOIN document_data d2 ON d1.row_data->>'MatchField' = d2.row_data->>'MatchField' WHERE d1.document_id = '${dbKnowledgeList[0].id}' AND d2.document_id = '${dbKnowledgeList[1]?.id}'"

When correlating data across documents:
- Look for common fields that might link the documents
- Use UNION ALL to combine similar data from different sources
- Use JOIN operations when documents share common identifiers
- Compare statistics across documents to find patterns or differences
`
    : ''
}

It is now ${new Date().toISOString()}.

IMAGES AND MARKDOWN:
- The data may contain markdown with embedded images: ![alt](https://url)
- ALWAYS preserve markdown image syntax in your response
- When relevant images exist or user asks for visuals, include them using markdown image syntax
- Example: If row_data contains "![chart](https://blob.url)", include that in your response

Return your answer using markdown formatting. Be concise and direct. Preserve any image references from the data.`
          },
          {
            role: 'user',
            content: question
          }
        ],
        stopWhen: stepCountIs(10)
      });

      const documentNames = dbKnowledgeList
        .map((doc) => `"${doc.name}"`)
        .join(', ');
      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: `Analyse van ${documentNames} voltooid`
        }
      });

      return text;
    }
  });
};

export default getToolResearchKnowledge;
