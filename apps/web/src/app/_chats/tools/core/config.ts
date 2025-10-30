import { z } from 'zod';

export const clearChatConfig = {
  name: 'clearChat',
  description: 'Clear the chat',
  inputSchema: z.object({})
} as const;

export const changeRoleConfig = {
  name: 'changeRole',
  description: 'Change the active role',
  inputSchema: z.object({
    roleName: z.string().describe('The name of the role to change to')
  })
} as const;

export const createMemoryConfig = {
  name: 'createMemory',
  description: 'Create a memory',
  inputSchema: z.object({
    memory: z.string().describe('The memory content to store')
  })
} as const;

export const deleteMemoryConfig = {
  name: 'deleteMemory',
  description: 'Delete a memory',
  inputSchema: z.object({
    memoryId: z.string().describe('The ID of the memory to delete')
  })
} as const;
