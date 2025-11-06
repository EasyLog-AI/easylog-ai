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
}

const getToolResearchKnowledge = (
  { agentId, roleId }: ToolResearchKnowledgeProps,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...researchKnowledgeConfig,
    execute: async ({ knowledgeId, question }) => {
      const id = uuidv4();
      const qb = new QueryBuilder();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: `Doorzoeken van kennisinhoud voor: "${question}"`
        }
      });

      // Verify knowledge access
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
        const errorMessage = 'Kennisitem niet gevonden of toegang geweigerd';
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: `Kennisitem niet gevonden of toegang geweigerd`
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
            content: `You are a knowledge research assistant. Your task is to answer the user's question using the provided knowledge data.

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

Knowledge Information:
- ID: ${dbKnowledge.id}
- Name: ${dbKnowledge.name}
- Summary: ${dbKnowledge.summary || 'N/A'}

Structure Analysis:
${JSON.stringify(dbKnowledge.analysis, null, 2)}

QUERY STRATEGY:
1. ALWAYS prioritize aggregate functions (COUNT, SUM, AVG, MIN, MAX) for overview information
2. Only use detailed row-by-row queries (LIMIT 25) if the user explicitly asks for specific examples
3. Start with summary statistics and trends rather than individual records
4. Use aggregate queries to understand data distribution and patterns
5. Focus on columns that seem most relevant to the question
6. Make multiple queries if needed to build a complete answer

Example aggregate queries:
- "SELECT COUNT(*) as total_rows FROM document_data WHERE document_id = '${dbKnowledge.id}'"
- "SELECT row_data->>'ColumnName' as value, COUNT(*) FROM document_data WHERE document_id = '${dbKnowledge.id}' GROUP BY value ORDER BY COUNT(*) DESC LIMIT 10"
- "SELECT AVG((row_data->>'NumericColumn')::numeric) as average FROM document_data WHERE document_id = '${dbKnowledge.id}'"

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

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: `Analyse van "${dbKnowledge.name}" voltooid`
        }
      });

      return text;
    }
  });
};

export default getToolResearchKnowledge;
