import { RealtimeSessionConfig } from '@openai/agents-realtime';
import { TRPCError } from '@trpc/server';

import chatMiddleware from '@/app/_chats/middleware/chatMiddleware';
import serverConfig from '@/server.config';

const createEphemeralToken = chatMiddleware.query(async ({}) => {
  const response = await fetch(
    'https://api.openai.com/v1/realtime/client_secrets',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serverConfig.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session: {
          type: 'realtime',
          model: 'gpt-realtime',
          audio: {
            output: {
              voice: 'marin'
            }
          }
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to create ephemeral token: ${error}`
    });
  }

  return (await response.json()) as {
    value: string;
    expires_at: number;
    session: RealtimeSessionConfig;
  };
});

export default createEphemeralToken;
