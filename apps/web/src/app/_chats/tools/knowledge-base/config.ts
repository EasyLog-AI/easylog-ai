import { z } from 'zod';

export const loadDocumentConfig = {
  name: 'loadDocument',
  description: 'Load a document into the knowledge base',
  inputSchema: z.object({
    documentId: z.string().describe('The ID of the document to load')
  })
} as const;

export const searchDocumentsConfig = {
  name: 'searchDocuments',
  description:
    'Search for relevant documents using hybrid vector + keyword search. Returns a list of document IDs, names, summaries, and similarity scores. Use this when you need to find which documents are relevant before researching them.',
  inputSchema: z.object({
    query: z.string().describe('The search query')
  })
} as const;

export const researchDocumentConfig = {
  name: 'researchDocument',
  description:
    'Research a specific document to answer a question. Uses a recursive AI agent to query document data and find answers. IMPORTANT: You must first use searchDocuments to get document IDs, then pass the ID (not the name) to this tool.',
  inputSchema: z.object({
    documentId: z
      .string()
      .uuid()
      .describe(
        'The UUID of the document to research (from searchDocuments results - use the "id" field, NOT the "name" field)'
      ),
    question: z.string().describe('The question to answer using this document')
  })
} as const;

export const exploreKnowledgeBaseConfig = {
  name: 'exploreKnowledgeBase',
  description:
    'Automatically search for relevant documents and research them to answer a question. Combines search + research in one tool. Use this when you want to comprehensively explore the knowledge base without knowing which specific documents to look at.',
  inputSchema: z.object({
    userSearchQuery: z
      .string()
      .describe('The question to answer by exploring the knowledge base')
  })
} as const;
