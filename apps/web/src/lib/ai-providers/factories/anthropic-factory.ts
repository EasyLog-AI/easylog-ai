import { createAnthropic } from '@ai-sdk/anthropic';

import serverConfig from '@/server.config';

type ContextManagementConfig = {
  enabled: boolean;
  edits?: Array<{ type: string; [key: string]: unknown }>;
};

const createAnthropicProvider = (
  contextManagement?: ContextManagementConfig
) => {
  if (!contextManagement?.enabled) {
    return createAnthropic({
      apiKey: serverConfig.anthropicApiKey
    });
  }

  const defaultEdits = [{ type: 'clear_tool_uses_20250919' }];
  const edits = contextManagement.edits ?? defaultEdits;

  return createAnthropic({
    apiKey: serverConfig.anthropicApiKey,
    headers: {
      'anthropic-beta':
        'context-management-2025-06-27,prompt-caching-2024-07-31'
    },
    fetch: async (url, options) => {
      if (!options?.body) {
        return fetch(url, options);
      }

      try {
        const body = JSON.parse(options.body as string);

        // Disable context_management when any non-text content is present (e.g., images, PDFs, documents)
        const hasNonTextContent = Array.isArray(body.messages)
          ? body.messages.some((msg: { content?: unknown }) => {
              const content = msg.content;
              if (Array.isArray(content)) {
                return content.some(
                  (part: { type?: string }) =>
                    part &&
                    typeof part === 'object' &&
                    // Allow known safe text/tool blocks
                    part.type !== 'text' &&
                    part.type !== 'input_text' &&
                    part.type !== 'tool_use' &&
                    part.type !== 'tool_result'
                );
              }
              // Strings are safe text; objects/others assume non-text
              return content && typeof content !== 'string';
            })
          : false;

        // Only add context_management if it's not already present AND there is no non-text content
        if (!body.context_management && !hasNonTextContent) {
          body.context_management = {
            edits
          };
        }

        // Add cache_control to system message for prompt caching
        if (body.system && typeof body.system === 'string') {
          // Convert system string to cache-enabled format
          body.system = [
            {
              type: 'text',
              text: body.system,
              cache_control: { type: 'ephemeral' }
            }
          ];
        } else if (Array.isArray(body.system)) {
          // Add cache_control to first system message block
          if (body.system[0] && typeof body.system[0] === 'object') {
            body.system[0].cache_control = { type: 'ephemeral' };
          }
        }

        // Calculate context size
        const contextSize = JSON.stringify(body).length;
        const systemSize = JSON.stringify(body.system || '').length;
        const messagesSize = JSON.stringify(body.messages || []).length;
        const toolsSize = JSON.stringify(body.tools || []).length;

        // Extract conversation details for logging
        const messages = body.messages || [];
        const recentMessages = messages.slice(-3); // Last 3 messages for context

        // Extract tool uses from recent conversation
        const toolUses: Array<{ name: string; id: string; input?: unknown }> =
          [];
        const toolResults: Array<{ tool_use_id: string; success?: boolean }> =
          [];

        for (const msg of messages) {
          if (Array.isArray(msg.content)) {
            for (const block of msg.content) {
              if (block.type === 'tool_use') {
                toolUses.push({
                  name: block.name,
                  id: block.id,
                  input: block.input
                });
              } else if (block.type === 'tool_result') {
                toolResults.push({
                  tool_use_id: block.tool_use_id,
                  success: !block.is_error
                });
              }
            }
          }
        }

        // Log to console for monitoring - show FULL details
        const logData = {
          model: body.model,
          messagesCount: body.messages.length,
          tools: body.tools?.length,
          toolsAvailable:
            body.tools?.map((t: { name: string }) => t.name) || [],
          context_management: body.context_management,
          systemHasCacheControl: Array.isArray(body.system)
            ? body.system[0]?.cache_control !== undefined
            : false,
          contextSizes: {
            total: contextSize,
            system: systemSize,
            messages: messagesSize,
            tools: toolsSize,
            estimatedTokens: Math.round(contextSize / 4) // Rough estimate: 4 chars = 1 token
          },
          conversation: {
            recentMessages: recentMessages.map(
              (msg: { role: string; content: unknown }) => ({
                role: msg.role,
                contentPreview: Array.isArray(msg.content)
                  ? msg.content.map((c: { type: string }) => c.type).join(', ')
                  : typeof msg.content === 'string'
                    ? msg.content.substring(0, 100) +
                      (msg.content.length > 100 ? '...' : '')
                    : 'unknown',
                hasToolUse:
                  Array.isArray(msg.content) &&
                  msg.content.some(
                    (c: { type: string }) => c.type === 'tool_use'
                  ),
                hasToolResult:
                  Array.isArray(msg.content) &&
                  msg.content.some(
                    (c: { type: string }) => c.type === 'tool_result'
                  )
              })
            ),
            toolUsesInConversation: toolUses.length,
            toolResultsInConversation: toolResults.length,
            recentToolUses: toolUses.slice(-5).map((t) => ({
              name: t.name,
              id: t.id
            }))
          }
        };

        // Log as single line for better grep-ability
        console.log('ANTHROPIC API REQUEST:', JSON.stringify(logData));

        const response = await fetch(url, {
          ...options,
          headers: {
            ...options?.headers
          },
          body: JSON.stringify(body)
        });

        // Stream usage logging (non-blocking):
        // We tee() the SSE stream so we can parse one branch for usage metrics
        // without consuming the original response stream returned to the caller.
        try {
          const originalBody = response.body;
          if (
            originalBody &&
            typeof (originalBody as ReadableStream<Uint8Array>).tee ===
              'function'
          ) {
            const [branchToClient, branchForLogging] = (
              originalBody as ReadableStream<Uint8Array>
            ).tee();

            // Return a new Response with the first branch so downstream streaming is preserved
            const returned = new Response(branchToClient, {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers
            });

            // Parse SSE on the second branch in the background and log cache usage & tool uses
            void (async () => {
              try {
                const reader = (
                  branchForLogging as ReadableStream<Uint8Array>
                ).getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                const toolUsesInResponse: Array<{
                  name: string;
                  id: string;
                  input: unknown;
                }> = [];
                let responseText = '';

                for (;;) {
                  const { value, done } = await reader.read();
                  if (done) break;
                  buffer += decoder.decode(value, { stream: true });
                  let idx = buffer.indexOf('\n');
                  while (idx >= 0) {
                    const line = buffer.slice(0, idx).trim();
                    buffer = buffer.slice(idx + 1);
                    idx = buffer.indexOf('\n');

                    // Anthropic SSE lines of interest are `data: {...}` JSON chunks
                    if (line.startsWith('data:')) {
                      const jsonText = line.slice(5).trim();
                      if (jsonText && jsonText !== '[DONE]') {
                        try {
                          const evt = JSON.parse(jsonText);

                          // Track tool uses in the response
                          if (
                            evt.type === 'content_block_start' &&
                            evt.content_block?.type === 'tool_use'
                          ) {
                            toolUsesInResponse.push({
                              name: evt.content_block.name,
                              id: evt.content_block.id,
                              input: evt.content_block.input
                            });
                            console.log(
                              'ANTHROPIC TOOL USE:',
                              JSON.stringify({
                                tool: evt.content_block.name,
                                id: evt.content_block.id,
                                input: evt.content_block.input
                              })
                            );
                          }

                          // Track text deltas for response preview
                          if (
                            evt.type === 'content_block_delta' &&
                            evt.delta?.type === 'text_delta'
                          ) {
                            responseText += evt.delta.text;
                          }

                          // usage may appear on evt.message.usage or evt.usage depending on event
                          const usage = evt?.message?.usage ?? evt?.usage;
                          const cacheCreation =
                            usage?.cache_creation_input_tokens ?? 0;
                          const cacheRead = usage?.cache_read_input_tokens ?? 0;

                          // Log any usage data we find
                          if (usage) {
                            console.log(
                              'ANTHROPIC USAGE:',
                              JSON.stringify(
                                {
                                  cache_creation_input_tokens: cacheCreation,
                                  cache_read_input_tokens: cacheRead,
                                  cache_hit:
                                    cacheRead > 0
                                      ? '✅ CACHE HIT!'
                                      : '❌ No cache hit',
                                  input_tokens: usage.input_tokens,
                                  output_tokens: usage.output_tokens
                                },
                                null,
                                2
                              )
                            );
                          }

                          // Log complete response summary at the end
                          if (evt.type === 'message_stop') {
                            console.log(
                              'ANTHROPIC RESPONSE:',
                              JSON.stringify({
                                toolsUsed: toolUsesInResponse.length,
                                tools: toolUsesInResponse.map((t) => t.name),
                                responsePreview:
                                  responseText.substring(0, 200) +
                                  (responseText.length > 200 ? '...' : ''),
                                responseLength: responseText.length
                              })
                            );
                          }
                        } catch {
                          // ignore malformed chunk
                        }
                      }
                    }
                  }
                }
              } catch {
                // ignore logging stream errors
              }
            })();

            return returned;
          }
        } catch {
          // If tee/streaming is unavailable, fall back to returning the original response
        }

        return response;
      } catch (error) {
        console.error('Error modifying Anthropic request:', error);
        // If parsing fails, just pass through the original request
        return fetch(url, options);
      }
    }
  });
};

export default createAnthropicProvider;
