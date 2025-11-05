import { UIMessageStreamWriter, tool } from 'ai';
import {
  and,
  cosineDistance,
  desc,
  eq,
  exists,
  gt,
  isNull,
  or,
  sql
} from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/pg-core';
import { v4 as uuidv4 } from 'uuid';

import db from '@/database/client';
import { documentRoleAccess, documents } from '@/database/schema';
import { generateEmbedding } from '@/lib/embeddings/generateEmbedding';

import { searchDocumentsConfig } from './config';

interface ToolSearchDocumentsProps {
  agentId: string;
  roleId?: string;
}

const getToolSearchDocuments = (
  { agentId, roleId }: ToolSearchDocumentsProps,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...searchDocumentsConfig,
    execute: async ({ query }) => {
      const id = uuidv4();
      const qb = new QueryBuilder();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: `Searching knowledge base for: "${query}"`
        }
      });

      // Generate embedding for the search query
      const queryEmbedding = await generateEmbedding(query);

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: `Running hybrid search (semantic + keyword matching)...`
        }
      });

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

      // Calculate similarity scores
      const vectorSimilarity = sql<number>`1 - (${cosineDistance(documents.embedding, queryEmbedding)})`;

      // Trigram similarity for fuzzy text matching (requires pg_trgm extension)
      const nameSimilarity = sql<number>`similarity(${documents.name}, ${query})`;
      const summarySimilarity = sql<number>`COALESCE(similarity(${documents.summary}, ${query}), 0)`;
      const tagsSimilarity = sql<number>`COALESCE(
        (SELECT MAX(similarity(tag, ${query}))
         FROM unnest(${documents.tags}) AS tag),
        0
      )`;

      // Best keyword similarity across name, summary, and tags
      const keywordSimilarity = sql<number>`GREATEST(${nameSimilarity}, ${summarySimilarity}, ${tagsSimilarity})`;

      // Combined ranking: vector (60%) + text fuzzy matching (40%)
      const combinedScore = sql<number>`(
        ${vectorSimilarity} * 0.6 +
        ${keywordSimilarity} * 0.4
      )`;

      // Hybrid search: combine vector similarity with fuzzy text matching
      const results = await db
        .select({
          id: documents.id,
          name: documents.name,
          summary: documents.summary,
          tags: documents.tags,
          similarity: combinedScore,
          cosineSimilarity: vectorSimilarity,
          keywordSimilarity: keywordSimilarity
        })
        .from(documents)
        .where(
          and(
            accessClause,
            or(
              // Vector similarity threshold
              gt(vectorSimilarity, 0.5),
              // Fuzzy text matching threshold (trigram similarity > 0.3)
              gt(nameSimilarity, 0.3),
              gt(summarySimilarity, 0.3),
              gt(tagsSimilarity, 0.3)
            )
          )
        )
        .orderBy(desc(combinedScore))
        .limit(10);

      console.log('Search results:', results);

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: `Found ${results.length} relevant document${results.length === 1 ? '' : 's'}`
        }
      });

      return results;
    }
  });
};

export default getToolSearchDocuments;
