import { tool } from 'ai';

import db from '@/database/client';
import { memories } from '@/database/schema';

import { createMemoryConfig } from './config';

const toolCreateMemory = ({
  userId,
  agentId
}: {
  userId: string;
  agentId: string;
}) =>
  tool({
    description: createMemoryConfig.description,
    inputSchema: createMemoryConfig.inputSchema,
    execute: async (input) => {
      await db.insert(memories).values({
        userId,
        agentId,
        content: input.memory
      });

      return 'Memory created';
    }
  });

export default toolCreateMemory;
