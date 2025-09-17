import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import z from 'zod';

import { MultipleChoiceSchema } from '@/app/_chats/schemas/multipleChoiceSchema';
import db from '@/database/client';
import { chats, multipleChoiceQuestions } from '@/database/schema';

import multipleChoiceQuestionMiddleware from '../middleware/multipleChoiceQuestionMiddleware';

const multipleChoiceQuestionUpdate = multipleChoiceQuestionMiddleware
  .meta({
    openapi: {
      method: 'PATCH',
      path: '/multiple-choice/questions',
      tags: ['Multiple Choice'],
      summary: 'Update a multiple choice answer',
      protect: true
    }
  })
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

    const messages = structuredClone(ctx.chat.messages);

    messages.forEach((message, messageIndex) => {
      message.parts.forEach((part) => {
        if (part.type === 'data-multiple-choice') {
          (part.data as MultipleChoiceSchema).answer = input.value;

          if (messageIndex + 1 < messages.length) {
            messages[messageIndex + 1].parts = [
              {
                type: 'text',
                text: input.value
              }
            ];
          }
        }
      });
    });

    await db
      .update(chats)
      .set({
        messages
      })
      .where(eq(chats.id, ctx.chat.id));

    return multipleChoiceQuestion;
  });

export default multipleChoiceQuestionUpdate;
