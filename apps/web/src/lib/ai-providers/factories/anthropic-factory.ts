import { createAnthropic } from '@ai-sdk/anthropic';

import serverConfig from '@/server.config';

type ContextManagementConfig = {
  enabled: boolean;
  edits?: Array<{ type: string; [key: string]: unknown }>;
};

const createAnthropicProvider = (contextManagement?: ContextManagementConfig) => {
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
    fetch: (url, options) => {
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

        return fetch(url, {
          ...options,
          headers: {
            ...options?.headers
          },
          body: JSON.stringify(body)
        });
      } catch {
        // If parsing fails, just pass through the original request
        return fetch(url, options);
      }
    }
  });
};

export default createAnthropicProvider;
