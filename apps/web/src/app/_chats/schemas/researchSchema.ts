import { z } from 'zod';

const researchSchema = z.object({
  status: z.enum(['loading', 'complete']),
  title: z.string(),
  body: z.string()
});

export type ResearchSchema = z.infer<typeof researchSchema>;

export default researchSchema;
