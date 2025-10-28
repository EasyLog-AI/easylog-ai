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
      console.log(
        '[CHANGEROLE] 🔄 Received role change request:',
        input.roleName
      );

      const role = roles.find((role) => role.name === input.roleName);

      if (!role) {
        console.log('[CHANGEROLE] ❌ Role not found:', input.roleName);
        return 'Role not found';
      }

      console.log('[CHANGEROLE] ✅ Role found:', {
        id: role.id,
        name: role.name,
        autoStartMessage: role.autoStartMessage
      });

      await db
        .update(chats)
        .set({
          activeRoleId: role.id
        })
        .where(eq(chats.id, chatId));

      console.log(
        '[CHANGEROLE] 💾 Database updated with new activeRoleId:',
        role.id
      );

      // If the role has an autoStartMessage, signal to continue immediately
      if (role.autoStartMessage) {
        const response = `Role changed to ${role.name}. The user says: "${role.autoStartMessage}". Continue immediately as ${role.name} and respond to this message.`;
        console.log(
          '[CHANGEROLE] 🚀 Returning with autoStartMessage:',
          response
        );
        return response;
      }

      const response = `Role changed to ${role.name}`;
      console.log(
        '[CHANGEROLE] ⏸️  Returning WITHOUT autoStartMessage:',
        response
      );
      return response;
    }
  });

export default toolChangeRole;
