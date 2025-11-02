import { z } from 'zod';

import db from '@/database/client';
import { agents } from '@/database/schema';
import { protectedProcedure } from '@/lib/trpc/procedures';

/**
 * Get all agents with their roles. Optionally filter by knowledgeBase
 * capability.
 */
const agentsGetMany = protectedProcedure
  .meta({
    route: {
      method: 'GET',
      path: '/api/orpc/agents',
      tags: ['Agents'],
      summary: 'List all agents with roles'
    }
  })
  .input(
    z
      .object({
        cursor: z.number().default(0),
        limit: z.number().min(1).max(100).default(10)
      })
      .optional()
      .default({})
  )
  .query(async ({ input }) => {
    const [data, total] = await Promise.all([
      db.query.agents.findMany({
        with: {
          roles: true,
          documents: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        limit: input.limit,
        offset: input.cursor
      }),
      db.$count(agents)
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

export default agentsGetMany;
