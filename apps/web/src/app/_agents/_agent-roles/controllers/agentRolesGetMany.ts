import db from '@/database/client';

import agentMiddleware from '../../middleware/agentMiddleware';

const agentRolesGetMany = agentMiddleware
  .meta({
    route: {
      method: 'GET',
      path: '/api/orpc/agents/:id/roles',
      tags: ['Agent Roles'],
      summary: 'Get all roles for an agent'
    }
  })
  .query(async ({ ctx }) => {
    return await db.query.agentRoles.findMany({
      where: {
        agentId: ctx.agent.id
      }
    });
  });

export default agentRolesGetMany;
