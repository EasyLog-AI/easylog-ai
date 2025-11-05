import { generateText, stepCountIs, tool } from 'ai';

import openrouterProvider from '@/lib/ai-providers/openrouter';

import { exploreKnowledgeConfig } from './config';
import getToolResearchKnowledge from './toolResearchKnowledge';
import getToolSearchKnowledge from './toolSearchKnowledge';

interface ToolExploreKnowledgeProps {
  agentId: string;
  roleId?: string;
}

const getToolExploreKnowledge = ({
  agentId,
  roleId
}: ToolExploreKnowledgeProps) => {
  return tool({
    ...exploreKnowledgeConfig,
    execute: async ({ question }) => {
      // Create a recursive AI agent that can use searchKnowledge and researchKnowledge tools
      const { text } = await generateText({
        model: openrouterProvider('google/gemini-2.5-flash'),
        tools: {
          searchKnowledge: getToolSearchKnowledge({ agentId, roleId }),
          researchKnowledge: getToolResearchKnowledge({ agentId, roleId })
        },
        messages: [
          {
            role: 'system',
            content: `You are a knowledge explorer specializing in finding information through systematic search and deep analysis.

Answer the user's question by exploring the knowledge base through multiple search strategies and thorough research.

## Available Tools
- searchKnowledge(query): Returns relevant knowledge items with IDs, names, summaries, and similarity scores
- researchKnowledge(knowledgeId, question): Deep-dives into a specific knowledge item to extract detailed information. Use the "id" field (UUID) from searchKnowledge results, NOT the "name" field.

## Exploration Strategy

1. Initial Search
- Start with the user's exact query using searchKnowledge
- Analyze search results: review names, summaries, and similarity scores
- Knowledge metadata might not reveal what's inside the content

2. Knowledge Research
- Always research promising items even if summaries don't explicitly mention the answer
- Invoices contain company websites, receipts have contact info, reports include data that's not in summaries
- Use researchKnowledge with specific, focused questions
- Research multiple items to cross-verify information

3. Iterative Search Refinement
If initial attempts don't yield results, systematically try:
- Broader terms: "IKEA" instead of "IKEA website URL"
- Entity names: Company names, person names, location names
- Related concepts: "invoice" when looking for company info, "report" for statistics
- Synonyms and variations: Different phrasings of the same concept

4. Synthesis
- Combine information from multiple sources
- Provide clear, direct answers with references
- If information isn't found, explicitly state what was searched and why it wasn't found

## Examples

Example 1: Finding a company website
- User asks: "What is the IKEA website?"
- Search: "IKEA" → finds item with id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" and name: "IKEA Invoice March 2024.pdf"
- Research: researchKnowledge("a1b2c3d4-e5f6-7890-abcd-ef1234567890", "What is the company website or URL?")
- Result: Website found in invoice header

Example 2: Finding specific data
- User asks: "How many employees does Acme Corp have?"
- Search: "Acme Corp employees" → finds item with id: "b2c3d4e5-f6a7-8901-bcde-f12345678901" and name: "Acme Annual Report 2024"
- Research: researchKnowledge("b2c3d4e5-f6a7-8901-bcde-f12345678901", "How many employees or staff members are mentioned?")
- Result: Employee count found in company overview section

## Output Guidelines
- Be thorough: Don't conclude "not found" until you've tried multiple search strategies
- Be specific: Include item names and relevant excerpts
- Be transparent: Explain your search process if the answer isn't obvious
- Be persistent: Use all 15 available steps if needed to find the answer
- Preserve markdown: If researchKnowledge returns markdown with images (![alt](url)), include them in your final answer
- Return markdown: Use markdown formatting in your response, especially for images, lists, and emphasis`
          },
          {
            role: 'user',
            content: question
          }
        ],
        stopWhen: stepCountIs(15)
      });

      return text;
    }
  });
};

export default getToolExploreKnowledge;
