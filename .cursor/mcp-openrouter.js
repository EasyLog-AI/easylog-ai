#!/usr/bin/env node

/**
 * OpenRouter MCP Server for Cursor Provides OpenRouter AI model access via
 * Model Context Protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  console.error('OPENROUTER_API_KEY environment variable is required');
  process.exit(1);
}

class OpenRouterServer {
  constructor() {
    this.server = new Server(
      {
        name: 'openrouter-mcp-server',
        version: '0.1.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupToolHandlers();

    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'openrouter_chat',
          description: 'Send a chat completion request to OpenRouter AI models',
          inputSchema: {
            type: 'object',
            properties: {
              model: {
                type: 'string',
                description:
                  "OpenRouter model name (e.g., 'anthropic/claude-sonnet-4', 'openai/gpt-4.1')",
                default: 'openai/gpt-4.1'
              },
              messages: {
                type: 'array',
                description: 'Array of chat messages',
                items: {
                  type: 'object',
                  properties: {
                    role: {
                      type: 'string',
                      enum: ['system', 'user', 'assistant']
                    },
                    content: {
                      type: 'string'
                    }
                  },
                  required: ['role', 'content']
                }
              },
              max_tokens: {
                type: 'number',
                description: 'Maximum tokens to generate',
                default: 1000
              },
              temperature: {
                type: 'number',
                description: 'Temperature for response generation (0-2)',
                default: 0.7,
                minimum: 0,
                maximum: 2
              },
              top_p: {
                type: 'number',
                description: 'Top-p sampling parameter',
                default: 1,
                minimum: 0,
                maximum: 1
              }
            },
            required: ['messages']
          }
        },
        {
          name: 'openrouter_models',
          description: 'List available OpenRouter models',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (name === 'openrouter_chat') {
          return await this.handleChatCompletion(args);
        } else if (name === 'openrouter_models') {
          return await this.handleListModels();
        } else {
          throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  async handleChatCompletion(args) {
    const {
      model = 'openai/gpt-4.1',
      messages,
      max_tokens = 1000,
      temperature = 0.7,
      top_p = 1
    } = args;

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://cursor.sh', // Optional referer
          'X-Title': 'EasyLog Cursor MCP' // Optional title
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens,
          temperature,
          top_p
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              model: data.model,
              content: data.choices[0]?.message?.content || 'No response',
              usage: data.usage,
              id: data.id,
              created: data.created
            },
            null,
            2
          )
        }
      ]
    };
  }

  async handleListModels() {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    // Filter to popular models to avoid overwhelming output
    const popularModels = data.data
      .filter(
        (model) =>
          model.id.includes('anthropic/claude') ||
          model.id.includes('openai/gpt') ||
          model.id.includes('google/') ||
          model.id.includes('meta-llama/') ||
          model.id.includes('mistral/')
      )
      .slice(0, 20); // Limit to first 20

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              models: popularModels.map((model) => ({
                id: model.id,
                name: model.name,
                description: model.description,
                pricing: model.pricing,
                context_length: model.context_length
              }))
            },
            null,
            2
          )
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('OpenRouter MCP server running on stdio');
  }
}

const server = new OpenRouterServer();
server.run().catch(console.error);
