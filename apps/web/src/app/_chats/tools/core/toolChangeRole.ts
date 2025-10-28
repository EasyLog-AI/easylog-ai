import { tool } from 'ai';
import { eq } from 'drizzle-orm';

import db from '@/database/client';
import { chats } from '@/database/schema';

import { changeRoleConfig } from './config';

interface Role {
  id: string;
  name: string;
  instructions: string;
  autoStartMessage: string | null;
}

interface User {
  id: string;
  name: string | null;
}

interface Agent {
  id: string;
  name: string;
}

const toolChangeRole = (chatId: string, roles: Role[], user: User, agent: Agent) =>
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
        autoStartMessage: role.autoStartMessage,
        hasInstructions: !!role.instructions
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

      // Build the response with the new role's instructions
      let response = `Role successfully changed to ${role.name}.\n\n`;
      
      // Replace template tokens in instructions (same as in main route)
      const processedInstructions = role.instructions
        .replaceAll('{{user.name}}', user.name ?? 'Unknown')
        .replaceAll('{{agent.name}}', agent.name)
        .replaceAll('{{role.name}}', role.name)
        .replaceAll('{{role.instructions}}', '') // This would be recursive, leave empty
        .replaceAll('{{role.model}}', 'gpt-5') // Default model placeholder
        .replaceAll('{{now}}', new Date().toISOString());
      
      // Add the new role instructions so the AI knows how to behave
      response += `## YOUR NEW ROLE INSTRUCTIONS AS ${role.name.toUpperCase()}:\n\n`;
      response += processedInstructions;
      response += '\n\n---\n\n';
      
      // If the role has an autoStartMessage, add it as an immediate prompt
      if (role.autoStartMessage) {
        response += `The user immediately says: "${role.autoStartMessage}".\n\n`;
        response += `IMPORTANT: You MUST now respond as ${role.name} following the instructions above. `;
        response += `Process the message "${role.autoStartMessage}" according to your new role instructions and respond appropriately.`;
        
        console.log('[CHANGEROLE] 🚀 Returning with autoStartMessage and instructions');
      } else {
        response += `You are now operating as ${role.name}. Wait for the next user message and respond according to your new role instructions above.`;
        console.log('[CHANGEROLE] ⏸️  Returning with instructions but WITHOUT autoStartMessage');
      }
      
      console.log('[CHANGEROLE] 📋 Response length:', response.length);
      console.log('[CHANGEROLE] 🔧 Template tokens replaced');
      return response;
    }
  });

export default toolChangeRole;
