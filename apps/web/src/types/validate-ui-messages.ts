import { z } from 'zod';

import { UIMessage } from './ui-messages';
import { providerMetadataSchema } from '../types/provider-metadata';

const textUIPartSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
  state: z.enum(['streaming', 'done']).optional(),
  providerMetadata: providerMetadataSchema.optional()
});

const reasoningUIPartSchema = z.object({
  type: z.literal('reasoning'),
  text: z.string(),
  state: z.enum(['streaming', 'done']).optional(),
  providerMetadata: providerMetadataSchema.optional()
});

const sourceUrlUIPartSchema = z.object({
  type: z.literal('source-url'),
  sourceId: z.string(),
  url: z.string(),
  title: z.string().optional(),
  providerMetadata: providerMetadataSchema.optional()
});

const sourceDocumentUIPartSchema = z.object({
  type: z.literal('source-document'),
  sourceId: z.string(),
  mediaType: z.string(),
  title: z.string(),
  filename: z.string().optional(),
  providerMetadata: providerMetadataSchema.optional()
});

const fileUIPartSchema = z.object({
  type: z.literal('file'),
  mediaType: z.string(),
  filename: z.string().optional(),
  url: z.string(),
  providerMetadata: providerMetadataSchema.optional()
});

const stepStartUIPartSchema = z.object({
  type: z.literal('step-start')
});

const dataUIPartSchema = z.object({
  type: z.string().startsWith('data-'),
  id: z.string().optional(),
  data: z.unknown()
});

const dynamicToolUIPartSchemas = [
  z.object({
    type: z.literal('dynamic-tool'),
    toolName: z.string(),
    toolCallId: z.string(),
    state: z.literal('input-streaming'),
    input: z.unknown().optional(),
    output: z.never().optional(),
    errorText: z.never().optional()
  }),
  z.object({
    type: z.literal('dynamic-tool'),
    toolName: z.string(),
    toolCallId: z.string(),
    state: z.literal('input-available'),
    input: z.unknown(),
    output: z.never().optional(),
    errorText: z.never().optional(),
    callProviderMetadata: providerMetadataSchema.optional()
  }),
  z.object({
    type: z.literal('dynamic-tool'),
    toolName: z.string(),
    toolCallId: z.string(),
    state: z.literal('output-available'),
    input: z.unknown(),
    output: z.unknown(),
    errorText: z.never().optional(),
    callProviderMetadata: providerMetadataSchema.optional(),
    preliminary: z.boolean().optional()
  }),
  z.object({
    type: z.literal('dynamic-tool'),
    toolName: z.string(),
    toolCallId: z.string(),
    state: z.literal('output-error'),
    input: z.unknown(),
    output: z.never().optional(),
    errorText: z.string(),
    callProviderMetadata: providerMetadataSchema.optional()
  })
];

const toolUIPartSchemas = [
  z.object({
    type: z.string().startsWith('tool-'),
    toolCallId: z.string(),
    state: z.literal('input-streaming'),
    providerExecuted: z.boolean().optional(),
    input: z.unknown().optional(),
    output: z.never().optional(),
    errorText: z.never().optional()
  }),
  z.object({
    type: z.string().startsWith('tool-'),
    toolCallId: z.string(),
    state: z.literal('input-available'),
    providerExecuted: z.boolean().optional(),
    input: z.unknown(),
    output: z.never().optional(),
    errorText: z.never().optional(),
    callProviderMetadata: providerMetadataSchema.optional()
  }),
  z.object({
    type: z.string().startsWith('tool-'),
    toolCallId: z.string(),
    state: z.literal('output-available'),
    providerExecuted: z.boolean().optional(),
    input: z.unknown(),
    output: z.unknown(),
    errorText: z.never().optional(),
    callProviderMetadata: providerMetadataSchema.optional(),
    preliminary: z.boolean().optional()
  }),
  z.object({
    type: z.string().startsWith('tool-'),
    toolCallId: z.string(),
    state: z.literal('output-error'),
    providerExecuted: z.boolean().optional(),
    input: z.unknown(),
    output: z.never().optional(),
    errorText: z.string(),
    callProviderMetadata: providerMetadataSchema.optional()
  })
];

export const uiMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['system', 'user', 'assistant']),
  metadata: z.unknown().optional(),
  parts: z.array(
    z.union([
      textUIPartSchema,
      reasoningUIPartSchema,
      sourceUrlUIPartSchema,
      sourceDocumentUIPartSchema,
      fileUIPartSchema,
      stepStartUIPartSchema,
      dataUIPartSchema,
      ...dynamicToolUIPartSchemas,
      ...toolUIPartSchemas
    ])
  )
});

export type SafeValidateUIMessagesResult<UI_MESSAGE extends UIMessage> =
  | {
      success: true;
      data: Array<UI_MESSAGE>;
    }
  | {
      success: false;
      error: Error;
    };
