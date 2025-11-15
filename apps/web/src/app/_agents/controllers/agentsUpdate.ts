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
    /**
     * Safety net: If allowedDomains is being updated and "*" is being removed,
     * automatically add the current user's domain to prevent lockout.
     * This is a server-side protection in case the client-side logic fails.
     */
    if (input.allowedDomains !== undefined) {
      const currentDomains = ctx.agent.allowedDomains;
      const newDomains = input.allowedDomains;
      const isRemovingWildcard =
        currentDomains.includes('*') && !newDomains.includes('*');

      if (isRemovingWildcard) {
        const userDomain = ctx.user.email.split('@')[1];
        const needsUserDomain = userDomain && !newDomains.includes(userDomain);

        if (needsUserDomain) {
          input.allowedDomains = [...newDomains, userDomain];
        }
      }
    }

    const [agent] = await db
      .update(agents)
      .set(input)
      .where(eq(agents.id, ctx.agent.id))
      .returning();

    return agent;
  });

export default agentsUpdate;
