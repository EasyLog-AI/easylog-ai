import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import z from 'zod';

import db from '@/database/client';
import { multipleChoiceQuestions } from '@/database/schema';

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

    return multipleChoiceQuestion;
  });

export default multipleChoiceQuestionUpdate;
