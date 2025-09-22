import { tool } from 'ai';
import { eq } from 'drizzle-orm';

import db from '@/database/client';
import { memories } from '@/database/schema';

import { deleteMemoryConfig } from './config';

const toolDeleteMemory = () =>
  tool({
    description: deleteMemoryConfig.description,
    inputSchema: deleteMemoryConfig.inputSchema,
    execute: async (input) => {
      await db.delete(memories).where(eq(memories.id, input.memoryId));

      return 'Memory deleted';
    }
  });

export default toolDeleteMemory;
