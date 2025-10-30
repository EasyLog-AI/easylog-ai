import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import db from '@/database/client';
import { protectedProcedure } from '@/lib/trpc/procedures';

const agentMiddleware = protectedProcedure
  .input(
    z.object({
      superAgentId: z.string()
    })
  )
  .use(async ({ next, ctx, input }) => {
    const superAgent = await db.query.superAgents.findFirst({
      where: {
        id: input.superAgentId
      }
    });

    if (!superAgent) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Super agent not found'
      });
    }

    return next({
      ctx: {
        ...ctx,
        superAgent
      }
    });
  });

export default agentMiddleware;
