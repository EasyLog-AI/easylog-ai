import { z } from 'zod';

const updateAgentSchema = z.object({
  name: z.string().min(1).optional(),
  prompt: z.string().min(1).optional(),
  defaultProvider: z
    .enum(['openrouter', 'anthropic', 'amazon-bedrock'])
    .optional(),
  defaultModel: z.string().min(1).optional(),
  defaultReasoning: z.boolean().optional(),
  defaultReasoningEffort: z.enum(['high', 'medium', 'low']).optional(),
  defaultCacheControl: z.boolean().optional(),
  autoStartMessage: z.string().optional().nullable(),
  voiceChatEnabled: z.boolean().optional(),
  voiceChatAutoMute: z.boolean().optional(),
  voiceChatVoice: z
    .enum([
      'alloy',
      'ash',
      'ballad',
      'cedar',
      'coral',
      'echo',
      'marin',
      'sage',
      'shimmer',
      'verse'
    ])
    .optional(),
  defaultCapabilities: z
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
    .optional(),
  allowedDomains: z.array(z.string()).optional()
});

export type UpdateAgentSchema = z.infer<typeof updateAgentSchema>;

export default updateAgentSchema;
