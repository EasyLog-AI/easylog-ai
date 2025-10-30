import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import db from '@/database/client';
import { protectedProcedure } from '@/lib/trpc/procedures';

const chatMiddleware = protectedProcedure
  .input(
    z.object({
      chatId: z.string()
    })
  )
  .use(async ({ next, ctx, input }) => {
    const chat = await db.query.chats.findFirst({
      where: {
        id: input.chatId
      }
    });

    if (!chat) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Chat not found'
      });
    }

    if (chat.userId !== ctx.user.id) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You are not allowed to get this chat'
      });
    }

    return next({
      ctx: {
        ...ctx,
        chat
      }
    });
  });

export default chatMiddleware;
