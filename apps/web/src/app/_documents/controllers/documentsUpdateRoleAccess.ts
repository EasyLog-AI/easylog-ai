import { eq } from 'drizzle-orm';
import { z } from 'zod';

import db from '@/database/client';
import { documentRoleAccess } from '@/database/schema';
import { protectedProcedure } from '@/lib/trpc/procedures';

const documentsUpdateRoleAccess = protectedProcedure
  .meta({
    route: {
      method: 'POST',
      path: '/api/orpc/documents/:documentId/role-access',
      tags: ['Documents'],
      summary: 'Update document role access configuration'
    }
  })
  .input(
    z.object({
      documentId: z.string().uuid(),
      allRoles: z.boolean(),
      roleIds: z.array(z.string().uuid()).default([])
    })
  )
  .mutation(async ({ input }) => {
    // Delete existing role access entries for this document
    await db
      .delete(documentRoleAccess)
      .where(eq(documentRoleAccess.documentId, input.documentId));

    if (input.allRoles) {
      // Create a single entry with null agentRoleId to indicate "all roles"
      await db.insert(documentRoleAccess).values({
        documentId: input.documentId,
        agentRoleId: null
      });
    } else if (input.roleIds.length > 0) {
      // Create entries for each specific role
      await db.insert(documentRoleAccess).values(
        input.roleIds.map((roleId) => ({
          documentId: input.documentId,
          agentRoleId: roleId
        }))
      );
    }

    return { success: true };
  });

export default documentsUpdateRoleAccess;
