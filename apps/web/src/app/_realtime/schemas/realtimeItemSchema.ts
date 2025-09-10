import { z } from 'zod';

// Redefined schemas from @openai/agents-realtime to match exact types
export const baseItemSchema = z.object({
  itemId: z.string()
});

const inputTextContentSchema = z.object({
  type: z.literal('input_text'),
  text: z.string()
});

const inputAudioContentSchema = z.object({
  type: z.literal('input_audio'),
  audio: z.string().nullable().optional(),
  transcript: z.string().nullable()
});

const outputTextContentSchema = z.object({
  type: z.literal('output_text'),
  text: z.string()
});

const outputAudioContentSchema = z.object({
  type: z.literal('output_audio'),
  audio: z.string().nullable().optional(),
  transcript: z.string().nullable().optional()
});

const systemMessageSchema = z.object({
  itemId: z.string(),
  previousItemId: z.string().nullable().optional(),
  type: z.literal('message'),
  role: z.literal('system'),
  content: z.array(inputTextContentSchema)
});

const userMessageSchema = z.object({
  itemId: z.string(),
  previousItemId: z.string().nullable().optional(),
  type: z.literal('message'),
  role: z.literal('user'),
  status: z.enum(['in_progress', 'completed']),
  content: z.array(z.union([inputTextContentSchema, inputAudioContentSchema]))
});

const assistantMessageSchema = z.object({
  itemId: z.string(),
  previousItemId: z.string().nullable().optional(),
  type: z.literal('message'),
  role: z.literal('assistant'),
  status: z.enum(['in_progress', 'completed', 'incomplete']),
  content: z.array(z.union([outputTextContentSchema, outputAudioContentSchema]))
});

export const realtimeMessageItemSchema = z.discriminatedUnion('role', [
  systemMessageSchema,
  userMessageSchema,
  assistantMessageSchema
]);

export const realtimeToolCallItemSchema = z.object({
  itemId: z.string(),
  previousItemId: z.string().nullable().optional(),
  type: z.literal('function_call'),
  status: z.enum(['in_progress', 'completed', 'incomplete']),
  arguments: z.string(),
  name: z.string(),
  output: z.string().nullable()
});

export const realtimeMcpCallItemSchema = z.object({
  itemId: z.string(),
  previousItemId: z.string().nullable().optional(),
  type: z.enum(['mcp_call', 'mcp_tool_call']),
  status: z.enum(['in_progress', 'completed', 'incomplete']),
  arguments: z.string(),
  name: z.string(),
  output: z.string().nullable()
});

export const realtimeMcpCallApprovalRequestItemSchema = z.object({
  itemId: z.string(),
  type: z.literal('mcp_approval_request'),
  serverLabel: z.string(),
  name: z.string(),
  arguments: z.record(z.string(), z.any()),
  approved: z.boolean().nullable().optional()
});

export const realtimeItemSchema = z.union([
  realtimeMessageItemSchema,
  realtimeToolCallItemSchema,
  realtimeMcpCallItemSchema,
  realtimeMcpCallApprovalRequestItemSchema
]);

export type RealtimeItem = z.infer<typeof realtimeItemSchema>;
export type RealtimeMessageItem = z.infer<typeof realtimeMessageItemSchema>;
export type RealtimeToolCallItem = z.infer<typeof realtimeToolCallItemSchema>;
export type RealtimeMcpCallItem = z.infer<typeof realtimeMcpCallItemSchema>;
export type RealtimeMcpCallApprovalRequestItem = z.infer<
  typeof realtimeMcpCallApprovalRequestItemSchema
>;
