import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import z from 'zod';

import { MultipleChoiceSchema } from '@/app/_chats/schemas/multipleChoiceSchema';
import db from '@/database/client';
import { chats, multipleChoiceQuestions } from '@/database/schema';

import multipleChoiceQuestionMiddleware from '../middleware/multipleChoiceQuestionMiddleware';

const multipleChoiceQuestionUpdate = multipleChoiceQuestionMiddleware
  .input(
    z.object({
      value: z.string()
    })
  )
  .mutation(async ({ ctx, input }) => {
    if (!ctx.multipleChoiceQuestion.options.includes(input.value)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid value'
      });
    }

    const [multipleChoiceQuestion] = await db
      .update(multipleChoiceQuestions)
      .set({
        value: input.value
      })
      .where(eq(multipleChoiceQuestions.id, ctx.multipleChoiceQuestion.id))
      .returning();

    const effectedMessageIndex = ctx.chat.messages.findIndex((message) => {
      return message.parts.some((part) => {
        return (
          part.type === 'data-multiple-choice' &&
          (part.data as MultipleChoiceSchema).id ===
            ctx.multipleChoiceQuestion.id
        );
      });
    });

    if (effectedMessageIndex === -1) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Message not found'
      });
    }

    ctx.chat.messages[effectedMessageIndex].parts.forEach((part) => {
      if (part.type === 'data-multiple-choice') {
        (part.data as MultipleChoiceSchema).answer = input.value;
      }
    });

    if (effectedMessageIndex + 1 < ctx.chat.messages.length) {
      ctx.chat.messages[effectedMessageIndex + 1].parts = [
        {
          type: 'text',
          text: input.value
        }
      ];
    }

    await db
      .update(chats)
      .set({
        messages: ctx.chat.messages
      })
      .where(eq(chats.id, ctx.chat.id));

    return multipleChoiceQuestion;
  });

export default multipleChoiceQuestionUpdate;
