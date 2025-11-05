import { z } from 'zod';

const executingToolSchema = z.object({
  status: z.enum(['in_progress', 'completed']),
  message: z.string()
});

export type ExecutingToolSchema = z.infer<typeof executingToolSchema>;

export default executingToolSchema;
