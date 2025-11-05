import OpenAI from 'openai';

import serverConfig from '@/server.config';

const openai = new OpenAI({
  apiKey: serverConfig.openaiApiKey
});

/**
 * Generate embeddings for text using OpenAI's text-embedding-ada-002 model
 * @param value The text to generate embeddings for
 * @returns Array of 1536 embedding dimensions
 */
export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll('\n', ' ');

  const { data } = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input
  });

  return data[0].embedding;
};
