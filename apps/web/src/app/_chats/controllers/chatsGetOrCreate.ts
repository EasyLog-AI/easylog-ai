import { UIMessage } from 'ai';

import agentMiddleware from '@/app/_agents/middleware/agentMiddleware';
import db from '@/database/client';
import { chats } from '@/database/schema';

const chatGetOrCreate = agentMiddleware.query(async ({ ctx }) => {
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
