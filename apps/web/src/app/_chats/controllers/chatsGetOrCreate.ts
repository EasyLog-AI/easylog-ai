import { UIMessage } from 'ai';
import type { ZodTypeAny } from 'zod';
import { z } from 'zod/v4';

import agentMiddleware from '@/app/_agents/middleware/agentMiddleware';
import db from '@/database/client';
import { chats } from '@/database/schema';
import { uiMessageSchema } from '@/types/validate-ui-messages';

const agentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  prompt: z.string(),
  defaultModel: z.string(),
  defaultReasoning: z.boolean(),
  defaultReasoningEffort: z.enum(['high', 'medium', 'low']),
  autoStartMessage: z.string().nullable().optional(),
  voiceChatEnabled: z.boolean(),
  voiceChatAutoMute: z.boolean(),
  voiceChatVoice: z.enum([
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
  ]),
  createdAt: z.date(),
  updatedAt: z.date()
});

const chatSchema = z
  .object({
    id: z.string().uuid(),
    agentId: z.string().uuid(),
    userId: z.string().uuid(),
    activeRoleId: z.string().uuid().nullable(),
    messages: z.array(uiMessageSchema),
    createdAt: z.date(),
    updatedAt: z.date()
  })
  .extend({
    agent: agentSchema
  });

const chatGetOrCreate = agentMiddleware
  .meta({
    route: {
      method: 'GET',
      path: '/api/orpc/chats',
      tags: ['Chats'],
      summary: 'Get and if needed create a chat for an agent'
    }
  })
  .output(chatSchema)
  .query(async ({ ctx }) => {
    const chat = await db.query.chats.findFirst({
      where: {
        agentId: ctx.agent.id,
        userId: ctx.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (chat) {
      return {
        ...chat,
        agent: ctx.agent
      };
    }

    const [newChat] = await db
      .insert(chats)
      .values({
        agentId: ctx.agent.id,
        userId: ctx.user.id,
        messages: [] satisfies UIMessage[]
      })
      .returning();

    return {
      ...newChat,
      agent: ctx.agent
    };
  });

export default chatGetOrCreate;
