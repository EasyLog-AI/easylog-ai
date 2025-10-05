import { AbortTaskRunError, logger, schedules } from '@trigger.dev/sdk';
import { eq } from 'drizzle-orm';

import db from '@/database/client';
import { superAgents } from '@/database/schema';

import { runSuperAgentJob } from './run-super-agent-job';

export const dispatchSuperAgentJob = schedules.task({
  id: 'dispatch-super-agents',
  run: async ({ externalId, scheduleId }) => {
    if (!externalId) {
      throw new AbortTaskRunError('External ID not found');
    }

    const superAgent = await db.query.superAgents.findFirst({
      where: {
        id: externalId
      },
      with: {
        agent: {
          with: {
            chats: {
              orderBy: {
                createdAt: 'desc'
              },
              with: {
                user: true
              }
            }
          }
        }
      }
    });

    if (!superAgent) {
      throw new AbortTaskRunError('Super agent not found');
    }

    await db
      .update(superAgents)
      .set({
        scheduleId: scheduleId
      })
      .where(eq(superAgents.id, superAgent.id));

    const lastChatPerUser = Object.values(
      superAgent.agent.chats.reduce(
        (acc, chat) => {
          if (
            !acc[chat.userId] ||
            chat.createdAt > acc[chat.userId].createdAt
          ) {
            acc[chat.userId] = chat;
          }
          return acc;
        },
        {} as Record<string, (typeof superAgent.agent.chats)[0]>
      )
    );

    logger.info(
      `Dispatching super agent ${superAgent.name} with ${lastChatPerUser.length} chats`
    );

    if (lastChatPerUser.length === 0) {
      return;
    }

    await runSuperAgentJob.batchTrigger(
      lastChatPerUser.map((chat) => ({
        payload: {
          superAgentId: superAgent.id,
          chatId: chat.id,
          userId: chat.userId
        }
      }))
    );
  }
});
