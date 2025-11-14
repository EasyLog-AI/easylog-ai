import { UIMessageStreamWriter, generateText, stepCountIs, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import openrouterProvider from '@/lib/ai-providers/openrouter';

import { exploreKnowledgeConfig } from './config';
import getToolResearchKnowledge from './toolResearchKnowledge';
import getToolSearchKnowledge from './toolSearchKnowledge';

interface ToolExploreKnowledgeProps {
  agentId: string;
  roleId?: string;
  streamWriterId?: string;
}

const getToolExploreKnowledge = (
  { agentId, roleId, streamWriterId }: ToolExploreKnowledgeProps,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...exploreKnowledgeConfig,
    execute: async ({ question }) => {
      const id = streamWriterId ?? uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Kennis verkennen...'
        }
      });

      try {
        // Create a recursive AI agent that can use searchKnowledge and researchKnowledge tools
        const { text } = await generateText({
          model: openrouterProvider('google/gemini-2.5-flash'),
          tools: {
            searchKnowledge: getToolSearchKnowledge(
              { agentId, roleId, streamWriterId: id },
              messageStreamWriter
            ),
            researchKnowledge: getToolResearchKnowledge(
              { agentId, roleId, streamWriterId: id },
              messageStreamWriter
            )
          },
          messages: [
            {
              role: 'system',
              content: `You are a knowledge explorer specializing in finding information through systematic search and deep analysis.

Answer the user's question by exploring the knowledge base through multiple search strategies and thorough research.

## Available Tools
- searchKnowledge(query): Returns relevant knowledge items with IDs, names, summaries, and similarity scores
- researchKnowledge(knowledgeIds, question): Deep-dives into one or more knowledge items to extract detailed information. Pass an array of UUIDs from the "id" field of searchKnowledge results. Can analyze multiple documents together to find correlations.

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
- Research: researchKnowledge(["a1b2c3d4-e5f6-7890-abcd-ef1234567890"], "What is the company website or URL?")
- Result: Website found in invoice header

Example 2: Finding specific data
- User asks: "How many employees does Acme Corp have?"
- Search: "Acme Corp employees" → finds item with id: "b2c3d4e5-f6a7-8901-bcde-f12345678901" and name: "Acme Annual Report 2024"
- Research: researchKnowledge(["b2c3d4e5-f6a7-8901-bcde-f12345678901"], "How many employees or staff members are mentioned?")
- Result: Employee count found in company overview section

Example 3: Correlating data across multiple documents
- User asks: "Compare sales data between Q1 and Q2 reports"
- Search: "sales report" → finds Q1 report (id: "c3d4e5f6...") and Q2 report (id: "d4e5f6a7...")
- Research: researchKnowledge(["c3d4e5f6...", "d4e5f6a7..."], "Compare total sales between these reports")
- Result: Cross-document analysis showing sales growth

## Output Guidelines
- Be thorough: Don't conclude "not found" until you've tried multiple search strategies
- Be specific: Include item names and relevant excerpts
- Be transparent: Explain your search process if the answer isn't obvious
- Be persistent: Use all 15 available steps if needed to find the answer
- Preserve markdown: If researchKnowledge returns markdown with images (![alt](url)), include them in your final answer
- Return markdown: Use markdown formatting in your response, especially for images, lists, and emphasis

It is now ${new Date().toISOString()}.
`
            },
            {
              role: 'user',
              content: question
            }
          ],
          stopWhen: stepCountIs(15)
        });

        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'completed',
            message: 'Kennisverkenning afgerond'
          }
        });

        return text;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        console.error('[toolExploreKnowledge] Error exploring knowledge', {
          agentId,
          roleId,
          question,
          error
        });
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: `Fout bij verkennen van kennis: ${message}`
          }
        });
        return `Error exploring knowledge: ${message}`;
      }
    }
  });
};

export default getToolExploreKnowledge;
