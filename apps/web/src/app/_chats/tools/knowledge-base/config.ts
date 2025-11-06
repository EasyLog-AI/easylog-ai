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
    'Search the knowledge base using hybrid semantic and keyword search. Returns metadata only: IDs, names, summaries, and similarity scores. Use this to find which knowledge items are relevant, then use researchKnowledge to access the actual data inside them.',
  inputSchema: z.object({
    query: z.string().describe('What to search for')
  })
} as const;

export const researchKnowledgeConfig = {
  name: 'researchKnowledge',
  description:
    'Access the FULL CONTENT of a knowledge item via SQL queries to answer any question about the data inside. Can answer questions about counts, statistics, trends, top N items, filtering by date/criteria, etc. Works on structured data (Excel, CSV) and unstructured content (PDFs, text). Always try this tool when asked about data - it has complete access to everything in the knowledge item.',
  inputSchema: z.object({
    knowledgeId: z
      .string()
      .uuid()
      .describe('UUID from searchKnowledge results (use id field)'),
    question: z
      .string()
      .describe(
        'Any question about the content - counts, statistics, filtering, top N, date ranges, etc.'
      )
  })
} as const;

export const exploreKnowledgeConfig = {
  name: 'exploreKnowledge',
  description:
    'Fully autonomous tool that combines searchKnowledge + researchKnowledge. Use this for complex questions where you need to find relevant knowledge items AND extract detailed answers from them. It will search, identify the best sources, and deep-dive into the content automatically.',
  inputSchema: z.object({
    question: z
      .string()
      .describe('Any complex question that requires finding and analyzing knowledge')
  })
} as const;
