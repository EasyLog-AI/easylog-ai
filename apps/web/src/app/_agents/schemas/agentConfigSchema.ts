import { z } from 'zod';

const roleConfigSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  instructions: z.string().min(1),
  model: z.string().min(1),
  reasoning: z.object({
    enabled: z.boolean().optional().default(false),
    effort: z.enum(['high', 'medium', 'low']).optional().default('medium')
  })
});

const agentConfigSchema = z.object({
  roles: z.array(roleConfigSchema),
  defaultRole: z.string().min(1)
});

export type AgentConfig = z.infer<typeof agentConfigSchema>;

export default agentConfigSchema;
