import { z } from 'zod';

export const loadDocumentConfig = {
  name: 'loadDocument',
  description: 'Load a document into the knowledge base',
  inputSchema: z.object({
    documentId: z.string().describe('The ID of the document to load')
  })
} as const;

export const searchKnowledgeConfig = {
  name: 'searchKnowledge',
  description:
    'Search the knowledge base using hybrid semantic and keyword search. Returns relevant knowledge items with their IDs, names, summaries, and similarity scores.',
  inputSchema: z.object({
    query: z.string().describe('What to search for')
  })
} as const;

export const researchKnowledgeConfig = {
  name: 'researchKnowledge',
  description:
    'Deep-dive into a specific knowledge item to answer a question. Requires the item ID from searchKnowledge results. Pass the id field, not the name.',
  inputSchema: z.object({
    knowledgeId: z
      .string()
      .uuid()
      .describe('UUID from searchKnowledge results (use id field)'),
    question: z.string().describe('Question to answer from this knowledge item')
  })
} as const;

export const exploreKnowledgeConfig = {
  name: 'exploreKnowledge',
  description:
    'Autonomously search and research the knowledge base to answer a question. Automatically finds relevant items and extracts answers.',
  inputSchema: z.object({
    question: z.string().describe('Question to answer from the knowledge base')
  })
} as const;
