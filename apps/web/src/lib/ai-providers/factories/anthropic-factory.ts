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

        // Clone the response to read its body for logging
        const clonedResponse = response.clone();
        const responseBody = await clonedResponse.json();

        if (responseBody.usage) {
          console.log('ANTHROPIC API USAGE:', {
            input_tokens: responseBody.usage.input_tokens,
            output_tokens: responseBody.usage.output_tokens,
            cache_creation_tokens: responseBody.usage.cache_creation_tokens,
            cache_read_tokens: responseBody.usage.cache_read_tokens
          });
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
