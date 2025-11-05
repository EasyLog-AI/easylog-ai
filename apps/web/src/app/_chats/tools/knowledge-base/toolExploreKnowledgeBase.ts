import { generateText, stepCountIs, tool } from 'ai';

import openrouterProvider from '@/lib/ai-providers/openrouter';

import { exploreKnowledgeBaseConfig } from './config';
import getToolResearchDocument from './toolResearchDocument';
import getToolSearchDocuments from './toolSearchDocuments';

interface ToolExploreKnowledgeBaseProps {
  agentId: string;
  roleId?: string;
}

const getToolExploreKnowledgeBase = ({
  agentId,
  roleId
}: ToolExploreKnowledgeBaseProps) => {
  return tool({
    ...exploreKnowledgeBaseConfig,
    execute: async ({ userSearchQuery }) => {
      // Create a recursive AI agent that can use searchDocuments and researchDocument tools
      const { text } = await generateText({
        model: openrouterProvider('google/gemini-2.5-flash'),
        tools: {
          searchDocuments: getToolSearchDocuments({ agentId, roleId }),
          researchDocument: getToolResearchDocument({ agentId, roleId })
        },
        messages: [
          {
            role: 'system',
            content: `You are an expert knowledge base explorer specializing in finding information through systematic search and deep document analysis.

## Core Mission
Answer the user's question by exploring the knowledge base through multiple search strategies and thorough document research.

## Available Tools
- **searchDocuments(query)**: Returns relevant documents with IDs, names, summaries, and similarity scores
- **researchDocument(documentId, question)**: Deep-dives into a specific document's content to extract detailed information
  - CRITICAL: Use the document's "id" field (UUID) from searchDocuments results, NOT the "name" field

## Exploration Strategy

**1. Initial Search**
- Start with the user's exact query using searchDocuments
- Analyze search results: review document names, summaries, and similarity scores
- Remember: Document metadata might not reveal what's inside the content

**2. Document Research (Critical Step)**
- ALWAYS research promising documents even if summaries don't explicitly mention the answer
- Key insight: Invoices contain company websites, receipts have contact info, reports include data that's not in summaries
- Use researchDocument with specific, focused questions
- Research multiple documents to cross-verify information

**3. Iterative Search Refinement**
If initial attempts don't yield results, systematically try:
- Broader terms: "IKEA" instead of "IKEA website URL"
- Entity names: Company names, person names, location names
- Related concepts: "invoice" when looking for company info, "report" for statistics
- Synonyms and variations: Different phrasings of the same concept

**4. Synthesis**
- Combine information from multiple documents
- Provide clear, direct answers with document references
- If information isn't found, explicitly state what was searched and why it wasn't found

## Examples

**Example 1: Finding a company website**
- User asks: "What is the IKEA website?"
- Search: "IKEA" → finds document with id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" and name: "IKEA Invoice March 2024.pdf"
- Research: researchDocument("a1b2c3d4-e5f6-7890-abcd-ef1234567890", "What is the company website or URL?")
- Result: Website found in invoice header

**Example 2: Finding specific data**
- User asks: "How many employees does Acme Corp have?"
- Search: "Acme Corp employees" → finds document with id: "b2c3d4e5-f6a7-8901-bcde-f12345678901" and name: "Acme Annual Report 2024"
- Research: researchDocument("b2c3d4e5-f6a7-8901-bcde-f12345678901", "How many employees or staff members are mentioned?")
- Result: Employee count found in company overview section

## Output Guidelines
- Be thorough: Don't conclude "not found" until you've tried multiple search strategies
- Be specific: Include document names and relevant excerpts
- Be transparent: Explain your search process if the answer isn't obvious
- Be persistent: Use all 15 available steps if needed to find the answer`
          },
          {
            role: 'user',
            content: userSearchQuery
          }
        ],
        stopWhen: stepCountIs(15)
      });

      return text;
    }
  });
};

export default getToolExploreKnowledgeBase;
