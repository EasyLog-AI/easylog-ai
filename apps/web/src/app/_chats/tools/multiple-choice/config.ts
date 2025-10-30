import { z } from 'zod';

export const answerMultipleChoiceConfig = {
  name: 'answerMultipleChoice',
  description: 'Answer a multiple choice question',
  inputSchema: z.object({
    multipleChoiceId: z
      .string()
      .describe('The id of the multiple choice question'),
    answer: z.string().describe('The answer to the multiple choice question')
  })
} as const;

export const createMultipleChoiceConfig = {
  name: 'createMultipleChoice',
  description: 'Create a multiple choice question',
  inputSchema: z.object({
    question: z.string().describe('The question to ask'),
    options: z.array(z.string()).describe('The options to choose from')
  })
} as const;
