import { createAnthropic } from '@ai-sdk/anthropic';

import serverConfig from '@/server.config';

/** @see https://docs.anthropic.com/claude/docs */
const anthropic = createAnthropic({
  apiKey: serverConfig.anthropicApiKey,
  fetch: (url, options) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        'anthropic-beta': 'context-management-2025-06-27'
      },
      body: JSON.stringify({
        ...JSON.parse(options?.body as string),
        context_management: {
          edits: [{ type: 'clear_tool_uses_20250919' }]
        }
      })
    });
  }
});

export default anthropic;
