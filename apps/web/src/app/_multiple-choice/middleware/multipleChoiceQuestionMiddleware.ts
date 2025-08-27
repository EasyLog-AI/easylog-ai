import { TRPCError } from '@trpc/server';
import z from 'zod';

import chatMiddleware from '@/app/_chats/middleware/chatMiddleware';
import db from '@/database/client';

const multipleChoiceQuestionMiddleware = chatMiddleware
  .input(
    z.object({
      multipleChoiceQuestionId: z.string()
    })
  )
  .use(async ({ ctx, input, next }) => {
    const multipleChoiceQuestion =
      await db.query.multipleChoiceQuestions.findFirst({
        where: {
          id: input.multipleChoiceQuestionId,
          chatId: ctx.chat.id
        }
      });

    if (!multipleChoiceQuestion) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Multiple choice question not found'
      });
    }

    return next({
      ctx: {
        ...ctx,
        multipleChoiceQuestion
      }
    });
  });

export default multipleChoiceQuestionMiddleware;
