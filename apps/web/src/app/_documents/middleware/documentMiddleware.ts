import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import db from '@/database/client';
import { protectedProcedure } from '@/lib/trpc/procedures';

/**
 * Middleware to fetch and validate document access. Enriches context with
 * document entity.
 */
const documentMiddleware = protectedProcedure
  .input(
    z.object({
      documentId: z.string().uuid()
    })
  )
  .use(async ({ next, ctx, input }) => {
    const document = await db.query.documents.findFirst({
      where: {
        id: input.documentId
      }
    });

    if (!document) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Document not found'
      });
    }

    return next({
      ctx: {
        ...ctx,
        document
      }
    });
  });

export default documentMiddleware;
