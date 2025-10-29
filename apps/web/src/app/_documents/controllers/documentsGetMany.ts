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

    return {
      data,
      meta: {
        total,
        cursor: input.cursor + input.limit,
        limit: input.limit
      }
    };
  });

export default documentsGetMany;
