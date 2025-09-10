import { tool } from '@openai/agents-realtime';
import z from 'zod';

import executeSQL from '@/app/_chats/tools/execute-sql/executeSQL';

export const toolExecuteSQL = tool({
  name: 'execute_sql',
  description: 'Execute a SQL query on the Easylog database',
  parameters: z.object({
    queryIntent: z.string().describe('What are you trying to achieve?'),
    proposedQuery: z.string()
  }),
  async execute({ queryIntent, proposedQuery }) {
    // await
  }
});
