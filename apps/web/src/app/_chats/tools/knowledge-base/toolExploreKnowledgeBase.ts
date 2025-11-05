import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, generateText, stepCountIs, tool } from 'ai';
import {
  and,
  cosineDistance,
  desc,
  eq,
  exists,
  gt,
  ilike,
  isNull,
  or,
  sql
} from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/pg-core';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import db from '@/database/client';
import { documentRoleAccess, documents } from '@/database/schema';
import openrouterProvider from '@/lib/ai-providers/openrouter';
import { generateEmbedding } from '@/lib/embeddings/generateEmbedding';
import splitArrayBatches from '@/utils/split-array-batches';
import tryCatch from '@/utils/try-catch';

import { exploreKnowledgeBaseConfig } from './config';

interface ToolExploreKnowledgeBaseProps {
  agentId: string;
  roleId?: string;
}

const getToolExploreKnowledgeBase = (
  { agentId, roleId }: ToolExploreKnowledgeBaseProps,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...exploreKnowledgeBaseConfig,
    execute: async ({ userSearchQuery }) => {
      const id = uuidv4();
      const qb = new QueryBuilder();

      messageStreamWriter?.write({
        type: 'data-research',
        id,
        data: {
          status: 'loading',
          title: 'Searching documents',
          body: `Searching relevant knowledge base documents for "${userSearchQuery}"`
        }
      });

      // Step 1: Hybrid search to find relevant documents
      const queryEmbedding = await generateEmbedding(userSearchQuery);

      const accessClause = and(
        eq(documents.agentId, agentId),
        or(
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

      const similarity = sql<number>`1 - (${cosineDistance(documents.embedding, queryEmbedding)})`;

      const searchResults = await db
        .select({
          id: documents.id,
          name: documents.name,
          summary: documents.summary,
          tags: documents.tags,
          analysis: documents.analysis,
          similarity
        })
        .from(documents)
        .where(
          and(
            accessClause,
            or(
              gt(similarity, 0.5),
              ilike(documents.name, `%${userSearchQuery}%`),
              ilike(documents.summary, `%${userSearchQuery}%`),
              sql`EXISTS (
                SELECT 1 FROM unnest(${documents.tags}) AS tag
                WHERE tag ILIKE ${`%${userSearchQuery}%`}
              )`
            )
          )
        )
        .orderBy(desc(similarity))
        .limit(5);

      console.log('Explore search results:', searchResults);

      if (searchResults.length === 0) {
        const noResultsMessage = 'No relevant documents found';
        messageStreamWriter?.write({
          type: 'data-research',
          id,
          data: {
            status: 'complete',
            title: 'No results',
            body: noResultsMessage
          }
        });
        return noResultsMessage;
      }

      messageStreamWriter?.write({
        type: 'data-research',
        id,
        data: {
          status: 'loading',
          title: 'Found relevant documents',
          body: `Found ${searchResults.length} relevant knowledge base documents`
        }
      });

      // Step 2: Research each document in batches
      const researchResults: {
        id: string;
        name: string;
        relevantInformation: string;
        similarity: number;
      }[] = searchResults.map((d) => ({
        id: d.id,
        name: d.name,
        relevantInformation: '',
        similarity: d.similarity
      }));

      const documentsInBatches = splitArrayBatches(researchResults, 3);

      for (const batch of documentsInBatches) {
        await Promise.all(
          batch.map(async (researchResult) => {
            const dbDocument = searchResults.find(
              (d) => d.id === researchResult.id
            );

            if (!dbDocument) {
              return;
            }

            messageStreamWriter?.write({
              type: 'data-research',
              id,
              data: {
                status: 'loading',
                title: 'Researching document',
                body: `Researching ${dbDocument.name}`
              }
            });

            // Use recursive agent to research this document
            const { text } = await generateText({
              model: openrouterProvider('google/gemini-2.5-flash'),
              tools: {
                toolExecuteSQL: tool({
                  description: 'Execute a SQL query on the Easylog database',
                  inputSchema: z.object({
                    query: z.string()
                  }),
                  execute: async (query) => {
                    console.log('Executing SQL query', query.query);

                    const [result, error] = await tryCatch(
                      db.execute(query.query)
                    );

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
                  content: `You are an expert information extractor and data analyst. Your task is to:

1. Analyze the document structure using the provided analysis object
2. Query the document_data table to extract relevant information based on the user's query
3. Return only the relevant information as plain text without commentary

The analysis object contains metadata about each column in the document:
- columnName: The name of the column
- columnType: The data type (string, number, date, boolean)
- sampleValues: Example values from the column
- uniqueValues: Number of unique values
- emptyValues: Number of empty values
- min/max: For numeric and date columns

You must use the toolExecuteSQL tool and query the document_data table to extract the actual relevant data.

IMPORTANT QUERY RULES:
- ALWAYS prioritize aggregate functions (COUNT, SUM, AVG, MIN, MAX) for overview and insights
- Only use LIMIT 25 for detailed row-by-row queries when user explicitly requests examples
- Start with summary statistics and trends, then provide specific examples only if needed
- You can break up your analysis into multiple steps/queries
- The document_data table structure:
  - id: UUID (primary key)
  - document_id: UUID (foreign key to documents table)
  - part_name: TEXT (document section/part)
  - row_id: INTEGER (row number within document)
  - row_data: JSONB (contains all row data as JSON objects)
  - created_at: TIMESTAMP
  - updated_at: TIMESTAMP

The row_data column contains JSON objects where each key is a column name and the value is the corresponding data.

Return only the relevant information as plain text without commentary. If you don't find any relevant information, return an empty string.`
                },
                {
                  role: 'user',
                  content: `User query: ${userSearchQuery}

Document name: ${dbDocument.name}
Document ID: ${dbDocument.id}

Document structure analysis:
${JSON.stringify(dbDocument.analysis, null, 2)}

Based on this analysis, determine which columns might contain relevant information for the user's query. Then use the toolExecuteSQL tool to query the document_data table with the document ID to extract the actual relevant data.

QUERY STRATEGY:
1. ALWAYS prioritize aggregate functions (COUNT, SUM, AVG, MIN, MAX) for overview information
2. Only use detailed row-by-row queries (LIMIT 25) if the user explicitly asks for specific examples
3. Start with summary statistics and trends rather than individual records`
                }
              ],
              stopWhen: stepCountIs(10)
            });

            researchResult.relevantInformation = text;

            messageStreamWriter?.write({
              type: 'data-research',
              id,
              data: {
                status: 'complete',
                title: 'Document research complete',
                body: `**${dbDocument.name}**\n\n${text}`
              }
            });
          })
        );
      }

      const finalResults = researchResults
        .filter((r) => r.relevantInformation.trim().length > 0)
        .map((r) => `**${r.name}**\n\n${r.relevantInformation}`)
        .join('\n\n---\n\n');

      messageStreamWriter?.write({
        type: 'data-research',
        id,
        data: {
          status: 'complete',
          title: 'Exploration complete',
          body: finalResults || 'No relevant information found in the documents'
        }
      });

      return researchResults;
    }
  });
};

export default getToolExploreKnowledgeBase;
