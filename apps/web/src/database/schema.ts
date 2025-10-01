import { UIMessage } from 'ai';
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid
} from 'drizzle-orm/pg-core';

export const timestamps = {
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date())
};

export const documentTypeEnum = pgEnum('document_type_enum', [
  'unknown',
  'pdf',
  'xlsx',
  'xml'
]);

export const documentStatusEnum = pgEnum('document_status_enum', [
  'pending',
  'processing',
  'completed',
  'failed'
]);

export const fieldTypeEnum = pgEnum('field_type_enum', [
  'string',
  'number',
  'date',
  'boolean'
]);

export const reasoningEffortEnum = pgEnum('reasoning_effort_enum', [
  'high',
  'medium',
  'low'
]);

export const voiceChatVoiceEnum = pgEnum('voice_chat_voice_enum', [
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
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  ...timestamps
});

export const memories = pgTable('memories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  content: text('content').notNull(),
  ...timestamps
});

export type User = typeof users.$inferSelect;

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', {
    mode: 'date',
    withTimezone: true
  }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  ...timestamps
});

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', {
    mode: 'date',
    withTimezone: true
  }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
    mode: 'date',
    withTimezone: true
  }),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  ...timestamps
});

export const verifications = pgTable('verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', {
    mode: 'date',
    withTimezone: true
  }).notNull(),
  ...timestamps
});

export const passkeys = pgTable('passkeys', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  publicKey: text('public_key').notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  credentialID: text('credential_id').notNull(),
  counter: integer('counter').notNull(),
  deviceType: text('device_type').notNull(),
  backedUp: boolean('backed_up').notNull(),
  transports: text('transports').notNull(),
  ...timestamps
});

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  path: text('path'),
  type: documentTypeEnum('type').notNull().default('unknown'),
  summary: text('summary'),
  tags: text('tags').array().notNull().default([]),
  content: jsonb('content'),
  analysis: jsonb('analysis').notNull().default({}),
  status: documentStatusEnum('status').notNull().default('pending'),
  agentId: uuid('agent_id')
    .references(() => agents.id, { onDelete: 'cascade' })
    .notNull(),
  ...timestamps
});

export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  prompt: text('prompt').notNull().default('You are a helpful assistant.'),
  defaultModel: text('default_model').notNull().default('gpt-5'),
  defaultReasoning: boolean('default_reasoning').notNull().default(false),
  defaultReasoningEffort: reasoningEffortEnum(
    'default_reasoning_effort'
  ).notNull(),
  autoStartMessage: text('auto_start_message').default('[hello]'),
  voiceChatEnabled: boolean('voice_chat_enabled').notNull().default(false),
  voiceChatAutoMute: boolean('voice_chat_auto_mute').notNull().default(false),
  voiceChatVoice: voiceChatVoiceEnum('voice_chat_voice')
    .notNull()
    .default('marin'),
  ...timestamps
});

export const agentRoles = pgTable('agent_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id')
    .references(() => agents.id, { onDelete: 'cascade' })
    .notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  instructions: text('instructions')
    .notNull()
    .default('You are a helpful assistant.'),
  model: text('model').notNull().default('gpt-5'),
  reasoning: boolean('reasoning').notNull().default(false),
  reasoningEffort: reasoningEffortEnum('reasoning_effort')
    .notNull()
    .default('medium'),
  ...timestamps
});

export const chats = pgTable('chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id')
    .references(() => agents.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  activeRoleId: uuid('active_role_id').references(() => agentRoles.id, {
    onDelete: 'cascade'
  }),
  /** TODO: come on jappie, we can do better than this */
  messages: jsonb('messages').notNull().default([]).$type<UIMessage[]>(),
  ...timestamps
});

export const documentData = pgTable('document_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id')
    .references(() => documents.id, { onDelete: 'cascade' })
    .notNull(),
  partName: text('part_name').notNull(),
  rowId: integer('row_id').notNull(),
  rowData: jsonb('row_data').notNull().default({}),
  ...timestamps
});

export const multipleChoiceQuestions = pgTable('multiple_choice_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id')
    .references(() => chats.id, { onDelete: 'cascade' })
    .notNull(),
  question: text('question').notNull(),
  options: text('options').array().notNull().default([]),
  value: text('value'),
  ...timestamps
});
