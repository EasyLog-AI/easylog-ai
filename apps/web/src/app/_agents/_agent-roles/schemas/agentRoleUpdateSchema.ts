import { z } from 'zod';

const agentRoleUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  instructions: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  provider: z.enum(['openrouter', 'anthropic', 'amazon-bedrock']).optional(),
  reasoning: z.boolean().optional(),
  reasoningEffort: z.enum(['high', 'medium', 'low']).optional(),
  cacheControl: z.boolean().optional(),
  autoStartMessage: z.string().optional().nullable(),
  capabilities: z
    .object({
      core: z.boolean().optional(),
      charts: z.boolean().optional(),
      planning: z.boolean().optional(),
      sql: z.boolean().optional(),
      knowledgeBase: z.boolean().optional(),
      loadDocument: z.boolean().optional(),
      memories: z.boolean().optional(),
      multipleChoice: z.boolean().optional(),
      pqiAudits: z.boolean().optional(),
      followUps: z.boolean().optional(),
      submissions: z.boolean().optional()
    })
    .optional()
});

export type AgentRoleUpdateSchema = z.infer<typeof agentRoleUpdateSchema>;

export default agentRoleUpdateSchema;
