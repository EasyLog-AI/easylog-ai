import chatMiddleware from '@/app/_chats/middleware/chatMiddleware';
import serverConfig from '@/server.config';

const createEphemeralToken = chatMiddleware.mutation(async ({}) => {
  // Create ephemeral token request to OpenAI
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
    throw new Error(`Failed to create ephemeral token: ${error}`);
  }

  const session = await response.json();

  return {
    client_secret: session.client_secret,
    session_id: session.id,
    expires_at: session.expires_at,
    model: session.model,
    voice: session.voice,
    instructions: session.instructions,
    turn_detection: session.turn_detection,
    input_audio_format: session.input_audio_format,
    output_audio_format: session.output_audio_format,
    input_audio_transcription: session.input_audio_transcription
  };
});

export default createEphemeralToken;
