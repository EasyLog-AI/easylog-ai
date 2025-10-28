import { tool } from 'ai';
import { eq } from 'drizzle-orm';

import db from '@/database/client';
import { chats } from '@/database/schema';

import { changeRoleConfig } from './config';

interface Role {
  id: string;
  name: string;
  autoStartMessage: string | null;
}

const toolChangeRole = (chatId: string, roles: Role[]) =>
  tool({
    description: changeRoleConfig.description,
    inputSchema: changeRoleConfig.inputSchema,
    execute: async (input) => {
      const role = roles.find((role) => role.name === input.roleName);

      if (!role) {
        return 'Role not found';
      }

      await db
        .update(chats)
        .set({
          activeRoleId: role.id
        })
        .where(eq(chats.id, chatId));

      // If the role has an autoStartMessage, signal to continue immediately
      if (role.autoStartMessage) {
        return `Role changed to ${role.name}. The user says: "${role.autoStartMessage}". Continue immediately as ${role.name} and respond to this message.`;
      }

      return `Role changed to ${role.name}`;
    }
  });

export default toolChangeRole;
