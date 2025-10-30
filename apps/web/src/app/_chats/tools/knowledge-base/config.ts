import { z } from 'zod';

export const loadDocumentConfig = {
  name: 'loadDocument',
  description: 'Load a document into the knowledge base',
  inputSchema: z.object({
    documentId: z.string().describe('The ID of the document to load')
  })
} as const;

export const searchKnowledgeBaseConfig = {
  name: 'searchKnowledgeBase',
  description: 'Search the knowledge base for information',
  inputSchema: z.object({
    userSearchQuery: z.string().describe('The question the user asked')
  })
} as const;
