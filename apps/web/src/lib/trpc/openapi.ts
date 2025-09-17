import { generateOpenApiDocument } from 'trpc-openapi';

import { appRouter } from '@/trpc-router';

export const createOpenApiDocument = (baseUrl: string) =>
  generateOpenApiDocument(appRouter, {
    title: 'Easylog API',
    description: 'OpenAPI specification generated from the tRPC router.',
    version: '1.0.0',
    baseUrl,
    tags: ['Auth', 'Documents', 'Chats', 'Multiple Choice', 'Realtime'],
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'better-auth.session_token'
      }
    }
  });

