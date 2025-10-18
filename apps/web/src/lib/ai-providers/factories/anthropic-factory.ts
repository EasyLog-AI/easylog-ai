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
      'anthropic-beta': 'context-management-2025-06-27'
    },
    fetch: async (url, options) => {
      if (!options?.body) {
        return fetch(url, options);
      }

      try {
        const body = JSON.parse(options.body as string);

        // Only add context_management if it's not already present
        if (!body.context_management) {
          body.context_management = {
            edits
          };
        }

        console.log(
          'ANTHROPIC API REQUEST:',
          JSON.stringify(
            {
              model: body.model,
              messagesCount: body.messages.length,
              system: body.system,
              tools: body.tools?.length,
              context_management: body.context_management
            },
            null,
            2
          )
        );

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
          const originalBody = (
            response as unknown as { body?: ReadableStream<Uint8Array> }
          ).body;
          if (originalBody && typeof (originalBody as any).tee === 'function') {
            const [branchToClient, branchForLogging] = (
              originalBody as any
            ).tee();

            // Return a new Response with the first branch so downstream streaming is preserved
            const returned = new Response(branchToClient as any, {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers
            });

            // Parse SSE on the second branch in the background and log cache usage
            void (async () => {
              try {
                const reader = (
                  branchForLogging as ReadableStream<Uint8Array>
                ).getReader();
                const decoder = new TextDecoder();
                let buffer = '';
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
                          // usage may appear on evt.message.usage or evt.usage depending on event
                          const usage = evt?.message?.usage ?? evt?.usage;
                          const cacheCreation =
                            usage?.cache_creation_tokens ?? 0;
                          const cacheRead = usage?.cache_read_tokens ?? 0;
                          if (cacheCreation > 0 || cacheRead > 0) {
                            console.log(
                              'ANTHROPIC USAGE:',
                              JSON.stringify(
                                {
                                  cache_creation_tokens: cacheCreation,
                                  cache_read_tokens: cacheRead
                                },
                                null,
                                2
                              )
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

            return returned as unknown as Response;
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
