import { z } from 'zod';

const scheduleSuperAgentSchema = z.object({
  cronExpression: z.string()
});

export type ScheduleSuperAgentSchema = z.infer<typeof scheduleSuperAgentSchema>;

export default scheduleSuperAgentSchema;
