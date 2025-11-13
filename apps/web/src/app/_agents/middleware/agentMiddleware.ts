import { TRPCError } from '@trpc/server';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

import db from '@/database/client';
import { protectedProcedure } from '@/lib/trpc/procedures';
import isUUID from '@/utils/is-uuid';

const agentMiddleware = protectedProcedure
  .input(
    z.object({
      agentId: z.string()
    })
  )
  .use(async ({ next, ctx, input }) => {
    const userDomain = ctx.user.email.split('@')[1];
    const idField = isUUID(input.agentId) ? 'id' : 'slug';

    const agent = await db.query.agents.findFirst({
      where: {
        [idField]: input.agentId,
        OR: [
          {
            RAW: (table) => sql`${table.allowedDomains} @> ARRAY['*']::text[]`
          },
          {
            RAW: (table) =>
              sql`${table.allowedDomains} @> ARRAY[${userDomain}]::text[]`
          }
        ]
      }
    });

    if (!agent) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Access denied to this agent'
      });
    }

    return next({
      ctx: {
        ...ctx,
        agent
      }
    });
  });

export default agentMiddleware;
