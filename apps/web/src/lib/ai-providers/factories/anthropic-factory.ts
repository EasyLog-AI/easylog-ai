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

        // Note: Cannot easily log usage metrics from streaming responses
        // The response is a Server-Sent Events stream, not a JSON object
        // Usage metrics are embedded in the stream events and would require
        // stream parsing to extract, which would consume the response body.
        // For now, we only log the request (which confirms context management is active)

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
