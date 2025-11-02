import db from '@/database/client';
import { agentRoles } from '@/database/schema';

import agentMiddleware from '../../middleware/agentMiddleware';
import agentRoleCreateSchema from '../schemas/agentRoleCreateSchema';

const agentRolesCreate = agentMiddleware
  .input(agentRoleCreateSchema)
  .meta({
    route: {
      method: 'POST',
      path: '/api/orpc/agents/:id/roles',
      tags: ['Agent Roles'],
      summary: 'Create a new role for an agent'
    }
  })
  .mutation(async ({ ctx, input: { agentId: _, ...data } }) => {
    const [role] = await db
      .insert(agentRoles)
      .values({
        agentId: ctx.agent.id,
        ...data
      })
      .returning();

    return role;
  });

export default agentRolesCreate;
