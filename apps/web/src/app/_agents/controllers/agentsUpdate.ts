import { eq } from 'drizzle-orm';

import db from '@/database/client';
import { agents } from '@/database/schema';

import agentMiddleware from '../middleware/agentMiddleware';
import updateAgentSchema from '../schemas/updateAgentSchema';

const agentsUpdate = agentMiddleware
  .meta({
    route: {
      method: 'PATCH',
      path: '/api/orpc/agents/:id',
      tags: ['Agents'],
      summary: 'Update an agent'
    }
  })
  .input(updateAgentSchema)
  .mutation(async ({ ctx, input }) => {
    const [agent] = await db
      .update(agents)
      .set(input)
      .where(eq(agents.id, ctx.agent.id))
      .returning();

    return agent;
  });

export default agentsUpdate;
