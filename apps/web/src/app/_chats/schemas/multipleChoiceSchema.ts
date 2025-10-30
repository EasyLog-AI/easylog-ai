import { z } from 'zod';

const multipleChoiceSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  answer: z.string().nullable().optional(),
  id: z.string(),
  value: z.string().nullable().optional()
});

export type MultipleChoiceSchema = z.infer<typeof multipleChoiceSchema>;

export default multipleChoiceSchema;
