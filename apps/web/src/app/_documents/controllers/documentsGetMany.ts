import { eq, exists } from 'drizzle-orm';
import { z } from 'zod';

import db from '@/database/client';
import { agents, documents } from '@/database/schema';
import { protectedProcedure } from '@/lib/trpc/procedures';
import isUUID from '@/utils/is-uuid';

const documentsGetMany = protectedProcedure
  .meta({
    route: {
      method: 'GET',
      path: '/api/orpc/documents',
      tags: ['Documents'],
      summary: 'List all documents with optional filtering'
    }
  })
  .input(
    z.object({
      cursor: z.number().default(0),
      limit: z.number().min(1).max(1000).default(10),
      filter: z
        .object({
          agentId: z.string().optional()
        })
        .optional()
    })
  )
  .query(async ({ input }) => {
    const [data, total] = await Promise.all([
      db.query.documents.findMany({
        where: input.filter?.agentId
          ? {
              agent: {
                [isUUID(input.filter.agentId) ? 'id' : 'slug']:
                  input.filter.agentId
              }
            }
          : undefined,
        orderBy: {
          createdAt: 'desc'
        },
        limit: input.limit,
        offset: input.cursor,
        with: {
          agent: true,
          roles: true
        }
      }),
      db.$count(
        documents,
        input.filter?.agentId
          ? exists(
              db
                .select()
                .from(agents)
                .where(
                  eq(
                    agents[isUUID(input.filter.agentId) ? 'id' : 'slug'],
                    input.filter.agentId
                  )
                )
            )
          : undefined
      )
    ]);

    const hasMore = input.cursor + input.limit < total;
    const nextCursor = hasMore ? input.cursor + input.limit : null;
    const previousCursor =
      input.cursor > 0 ? Math.max(0, input.cursor - input.limit) : null;

    return {
      data,
      meta: {
        total,
        nextCursor,
        previousCursor
      }
    };
  });

export default documentsGetMany;
