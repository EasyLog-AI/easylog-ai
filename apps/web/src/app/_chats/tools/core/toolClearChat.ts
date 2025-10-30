import { tool } from 'ai';

import db from '@/database/client';
import { chats } from '@/database/schema';

import { clearChatConfig } from './config';

const toolClearChat = (chatId: string, agentId: string, userId: string) =>
  tool({
    description: clearChatConfig.description,
    inputSchema: clearChatConfig.inputSchema,
    execute: async () => {
      await db.insert(chats).values({
        agentId,
        userId
      });

      return 'Chat cleared';
    }
  });

export default toolClearChat;
