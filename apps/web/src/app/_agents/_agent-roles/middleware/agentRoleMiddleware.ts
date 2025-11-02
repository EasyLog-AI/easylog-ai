import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import db from '@/database/client';

import agentMiddleware from '../../middleware/agentMiddleware';

const agentRoleMiddleware = agentMiddleware
  .input(
    z.object({
      roleId: z.string().uuid()
    })
  )
  .use(async ({ next, ctx, input }) => {
    const role = await db.query.agentRoles.findFirst({
      where: {
        id: input.roleId,
        agentId: ctx.agent.id
      }
    });

    if (!role) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Role not found'
      });
    }

    return next({
      ctx: {
        ...ctx,
        role
      }
    });
  });

export default agentRoleMiddleware;
