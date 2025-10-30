import { tool } from 'ai';

import createTRPCContext from '@/lib/trpc/context';
import { createCallerFactory } from '@/lib/trpc/trpc';
import { appRouter } from '@/trpc-router';

import { answerMultipleChoiceConfig } from './config';

export interface ToolAnswerMultipleChoiceProps {
  chatId: string;
}

const toolAnswerMultipleChoice = ({
  chatId
}: ToolAnswerMultipleChoiceProps) => {
  return tool({
    ...answerMultipleChoiceConfig,
    execute: async ({ multipleChoiceId, answer }) => {
      const ctx = await createTRPCContext();
      const caller = createCallerFactory(appRouter)(ctx);

      await caller.multipleChoice.update({
        chatId,
        multipleChoiceQuestionId: multipleChoiceId,
        value: answer
      });

      return {
        multipleChoiceId,
        answer
      };
    }
  });
};

export default toolAnswerMultipleChoice;
