import { UIMessageStreamWriter, tool } from 'ai';
import { z } from 'zod';

import createTRPCContext from '@/lib/trpc/context';
import { createCallerFactory } from '@/lib/trpc/trpc';
import { appRouter } from '@/trpc-router';

export interface ToolAnswerMultipleChoiceProps {
  chatId: string;
}

const toolAnswerMultipleChoice = (
  { chatId }: ToolAnswerMultipleChoiceProps,
  messageStreamWriter: UIMessageStreamWriter
) => {
  return tool({
    description: 'Answer a multiple choice question',
    inputSchema: z.object({
      multipleChoiceId: z
        .string()
        .describe('The id of the multiple choice question'),
      answer: z.string().describe('The answer to the multiple choice question')
    }),
    execute: async ({ multipleChoiceId, answer }) => {
      const ctx = await createTRPCContext();
      const caller = createCallerFactory(appRouter)(ctx);

      const result = await caller.multipleChoice.update({
        chatId,
        multipleChoiceQuestionId: multipleChoiceId,
        value: answer
      });

      messageStreamWriter.write({
        type: 'data-multiple-choice',
        id: result.id,
        data: {
          id: result.id,
          question: result.question,
          options: result.options
        }
      });

      return {
        multipleChoiceId,
        answer
      };
    }
  });
};

export default toolAnswerMultipleChoice;
