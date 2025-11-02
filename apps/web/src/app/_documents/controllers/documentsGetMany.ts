import { z } from 'zod';

import db from '@/database/client';
import { documents } from '@/database/schema';
import { protectedProcedure } from '@/lib/trpc/procedures';

const documentsGetMany = protectedProcedure
  .meta({
    route: {
      method: 'GET',
      path: '/api/orpc/documents',
      tags: ['Documents'],
      summary: 'List all documents'
    }
  })
  .input(
    z.object({
      cursor: z.number().default(0),
      limit: z.number().min(1).max(100).default(10)
    })
  )
  .query(async ({ input }) => {
    const [data, total] = await Promise.all([
      db.query.documents.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        limit: input.limit,
        offset: input.cursor,
        with: {
          agents: true,
          roles: true
        }
      }),
      db.$count(documents)
    ]);

    const hasMore = input.cursor + input.limit < total;
    const nextCursor = hasMore ? input.cursor + input.limit : null;
    const previousCursor = input.cursor > 0 ? Math.max(0, input.cursor - input.limit) : null;

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
