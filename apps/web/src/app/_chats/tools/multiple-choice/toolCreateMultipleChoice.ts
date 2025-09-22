import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import db from '@/database/client';
import { multipleChoiceQuestions } from '@/database/schema';

import { createMultipleChoiceConfig } from './config';

export interface ToolCreateMultipleChoiceProps {
  chatId: string;
}

const getToolCreateMultipleChoice = (
  { chatId }: ToolCreateMultipleChoiceProps,
  messageStreamWriter: UIMessageStreamWriter
) => {
  return tool({
    ...createMultipleChoiceConfig,
    execute: async ({ question, options }) => {
      const id = uuidv4();

      messageStreamWriter.write({
        type: 'data-multiple-choice',
        id,
        data: {
          id,
          question,
          options
        }
      });

      const [multipleChoiceQuestion] = await db
        .insert(multipleChoiceQuestions)
        .values({
          id,
          question,
          options,
          chatId
        })
        .returning();

      return multipleChoiceQuestion;
    }
  });
};

export default getToolCreateMultipleChoice;
