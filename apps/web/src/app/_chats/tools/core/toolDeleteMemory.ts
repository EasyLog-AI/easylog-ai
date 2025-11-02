import { tool } from 'ai';
import { and, eq } from 'drizzle-orm';

import db from '@/database/client';
import { memories } from '@/database/schema';

import { deleteMemoryConfig } from './config';

const toolDeleteMemory = ({
  userId,
  agentId
}: {
  userId: string;
  agentId: string;
}) =>
  tool({
    description: deleteMemoryConfig.description,
    inputSchema: deleteMemoryConfig.inputSchema,
    execute: async (input) => {
      await db
        .delete(memories)
        .where(
          and(
            eq(memories.id, input.memoryId),
            eq(memories.userId, userId),
            eq(memories.agentId, agentId)
          )
        );

      return 'Memory deleted';
    }
  });

export default toolDeleteMemory;
