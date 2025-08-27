import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, generateText, stepCountIs, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import openrouterProvider from '@/lib/ai-providers/openrouter';
import easylogDb from '@/lib/easylog/db';
import tryCatch from '@/utils/try-catch';

/**
 * Truncates string values in an object to a maximum of 1000 characters
 * Recursively processes nested objects and arrays
 */
const truncateStrings = (obj: unknown, maxLength: number = 1000): unknown => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return obj.length > maxLength
      ? obj.substring(0, maxLength) +
          `... (truncated ${obj.length - maxLength} characters)`
      : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => truncateStrings(item, maxLength));
  }

  if (typeof obj === 'object') {
    const truncated: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      truncated[key] = truncateStrings(value, maxLength);
    }
    return truncated;
  }

  return obj;
};

const toolExecuteSQL = (messageStreamWriter: UIMessageStreamWriter) => {
  return tool({
    description: 'Execute a query on the Easylog database.',
    inputSchema: z.object({
      queryIntent: z.string().describe('What are you trying to achieve?'),
      proposedQuery: z.string().optional()
    }),
    execute: async (query) => {
      const id = uuidv4();

      console.log('Executing SQL query', query.proposedQuery);

      messageStreamWriter.write({
        type: 'data-research',
        id,
        data: {
          status: 'loading',
          title: 'Executing query',
          body: `${query.queryIntent}`
        }
      });

      const [result, error] = await tryCatch(
        generateText({
          model: openrouterProvider('google/gemini-2.5-flash'),
          prompt: `
          You are an expert SQL analyst with access to the Easylog database. Your task is to execute queries and provide clear, actionable results.

          CRITICAL RULES:
          - ALWAYS limit SELECT queries to 20 rows maximum using LIMIT 20
          - PREFER aggregate functions when the user wants summaries, counts, or analysis
          - For large datasets, use GROUP BY with aggregate functions instead of raw data
          - Support SELECT, UPDATE, DELETE operations as requested
          - Provide clear explanations of what the query does and what the results mean
          - If the query fails, explain the error and suggest corrections

          OUTPUT FORMAT:
          Return plain text with:
          - Brief explanation of what the query accomplished
          - The query results in a clear, readable format
          - Error message if the query fails or omit if successful

          EXAMPLES:
          - "Show me all users" → SELECT * FROM users LIMIT 20
          - "How many orders per month?" → SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as order_count FROM orders GROUP BY month ORDER BY month
          - "Total sales by product" → SELECT product_name, SUM(amount) as total_sales FROM orders GROUP BY product_name ORDER BY total_sales DESC LIMIT 20

          Here is the user query:
          ${query.proposedQuery}

          And here is the explanation of the query:
          ${query.queryIntent}
        `,
          tools: {
            executeSQL: tool({
              description: 'Execute a SQL query on the Easylog database',
              inputSchema: z.object({
                query: z.string()
              }),
              execute: async (query) => {
                messageStreamWriter.write({
                  type: 'data-research',
                  id,
                  data: {
                    status: 'loading',
                    title: 'Executing query',
                    body: `${query.query}`
                  }
                });

                const [result, error] = await tryCatch(
                  easylogDb.execute(query.query)
                );

                if (error) {
                  Sentry.captureException(error);
                  console.error(error);
                  return `Error executing SQL query: ${error.message}`;
                }

                const truncatedResult = truncateStrings(result, 1000);

                const json = JSON.stringify(
                  {
                    result: truncatedResult,
                    explanation: `Successfully executed SQL query: ${query.query}`,
                    error: null
                  },
                  null,
                  2
                );

                return json;
              }
            })
          },
          prepareStep: (step) => {
            if (step.steps.at(-1)?.toolCalls.length === 0) {
              messageStreamWriter.write({
                type: 'data-research',
                id,
                data: {
                  status: 'loading',
                  title: 'Researching query results'
                }
              });
            }
            return step;
          },
          stopWhen: stepCountIs(5)
        })
      );

      if (error) {
        Sentry.captureException(error);
        console.error(error);
        return `Error executing SQL query: ${error.message}`;
      }

      messageStreamWriter.write({
        type: 'data-research',
        id,
        data: {
          status: 'complete',
          title: 'Query executed',
          body: result.text
        }
      });

      return {
        result: result.text
      };
    }
  });
};

export default toolExecuteSQL;
