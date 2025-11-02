import { eq } from 'drizzle-orm';

import db from '@/database/client';
import { agentRoles } from '@/database/schema';

import agentRoleMiddleware from '../middleware/agentRoleMiddleware';

const agentRolesDelete = agentRoleMiddleware
  .meta({
    route: {
      method: 'DELETE',
      path: '/api/orpc/agents/:id/roles/:roleId',
      tags: ['Agent Roles'],
      summary: 'Delete a role for an agent'
    }
  })
  .mutation(async ({ ctx }) => {
    await db.delete(agentRoles).where(eq(agentRoles.id, ctx.role.id));

    return { success: true };
  });

export default agentRolesDelete;
