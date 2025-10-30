import { schedules } from '@trigger.dev/sdk';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import db from '@/database/client';
import { superAgents } from '@/database/schema';
import { dispatchSuperAgentJob } from '@/jobs/super-agent/dispatch-super-agent-agent-job';

import superAgentMiddleware from '../middleware/superAgentMiddleware';

const scheduleSuperAgent = superAgentMiddleware
  .input(
    z.object({
      cronExpression: z.string()
    })
  )
  .mutation(async ({ ctx, input: { superAgentId, cronExpression } }) => {
    if (ctx.superAgent.scheduleId) {
      await schedules.del(ctx.superAgent.scheduleId);
    }

    const schedule = await schedules.create({
      task: dispatchSuperAgentJob.id,
      externalId: superAgentId,
      cron: cronExpression,
      deduplicationKey: `superAgentId:${superAgentId}`
    });

    await db
      .update(superAgents)
      .set({
        scheduleId: schedule.id
      })
      .where(eq(superAgents.id, superAgentId));
  });

export default scheduleSuperAgent;
