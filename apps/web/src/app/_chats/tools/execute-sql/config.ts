import { z } from 'zod';

export const executeSQLConfig = {
  name: 'executeSQL',
  description: 'Execute a query on the Easylog database.',
  inputSchema: z.object({
    queryIntent: z.string().describe('What are you trying to achieve?'),
    proposedQuery: z.string().optional()
  })
} as const;
