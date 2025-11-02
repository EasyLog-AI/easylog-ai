import { eq } from 'drizzle-orm';
import { z } from 'zod';

import db from '@/database/client';
import { agentRoles } from '@/database/schema';

import agentRoleMiddleware from '../middleware/agentRoleMiddleware';
import agentRoleUpdateSchema from '../schemas/agentRoleUpdateSchema';

const agentRolesUpdate = agentRoleMiddleware
  .input(
    z.object({
      data: agentRoleUpdateSchema
    })
  )
  .meta({
    route: {
      method: 'PATCH',
      path: '/api/orpc/agents/:id/roles/:roleId',
      tags: ['Agent Roles'],
      summary: 'Update a role for an agent'
    }
  })
  .mutation(async ({ ctx, input }) => {
    const [updatedRole] = await db
      .update(agentRoles)
      .set(input.data)
      .where(eq(agentRoles.id, ctx.role.id))
      .returning();

    return updatedRole;
  });

export default agentRolesUpdate;
