import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import db from '@/database/client';
import { multipleChoiceQuestions } from '@/database/schema';

export interface ToolCreateMultipleChoiceProps {
  chatId: string;
}

const getToolCreateMultipleChoice = (
  { chatId }: ToolCreateMultipleChoiceProps,
  messageStreamWriter: UIMessageStreamWriter
) => {
  return tool({
    description: 'Create a multiple choice question',
    inputSchema: z.object({
      question: z.string().describe('The question to ask'),
      options: z.array(z.string()).describe('The options to choose from')
    }),
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
