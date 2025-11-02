import { z } from 'zod';

const agentRoleFormSchema = z
  .object({
    isDefault: z.boolean().default(false),
    name: z.string().min(1, 'Naam is verplicht'),
    description: z.string().default(''),
    instructions: z.string().min(1, 'Instructies zijn verplicht'),
    model: z.string().min(1, 'Model is verplicht'),
    provider: z.enum(['openrouter', 'anthropic', 'amazon-bedrock']),
    reasoning: z.boolean().default(false),
    reasoningEffort: z.enum(['high', 'medium', 'low']).default('medium'),
    cacheControl: z.boolean().default(false),
    autoStartMessage: z
      .string()
      .transform((val) => (val === '' ? null : val))
      .nullable()
      .optional(),
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
  })
  .transform((data) => ({
    ...data,
    autoStartMessage:
      data.autoStartMessage === '' ? null : data.autoStartMessage
  }));

export type AgentRoleFormSchema = z.infer<typeof agentRoleFormSchema>;

export default agentRoleFormSchema;
