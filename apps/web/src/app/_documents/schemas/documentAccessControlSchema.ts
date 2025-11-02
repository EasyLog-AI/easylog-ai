import { z } from 'zod';

/**
 * Schema for document access control configuration. Defines which agents and
 * roles can access a document.
 */
const documentAccessControlSchema = z
  .object({
    /** If true, document is public to all agents (no entries in document_access) */
    allAgents: z.boolean(),

    /** Array of agent access configurations */
    agentAccess: z.array(
      z.object({
        /** Agent UUID */
        agentId: z.string().uuid(),

        /**
         * If true, all roles for this agent can access. If false, only specific
         * roleIds
         */
        allRoles: z.boolean(),

        /** Array of role UUIDs. Only used when allRoles is false */
        roleIds: z.array(z.string().uuid()).default([])
      })
    )
  })
  .refine((data) => data.allAgents || data.agentAccess.length > 0, {
    message: 'Select at least one agent or make available to all agents'
  });

export type DocumentAccessControl = z.infer<typeof documentAccessControlSchema>;

export default documentAccessControlSchema;
