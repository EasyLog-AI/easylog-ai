import { OpenAPIHandler } from '@orpc/openapi/fetch'; // or '@orpc/server/node'
import { onError } from '@orpc/server';
import { CORSPlugin } from '@orpc/server/plugins';
import { ZodSmartCoercionPlugin } from '@orpc/zod';

import createTRPCContext from '@/lib/trpc/context';
import orpcRouter from '@/orpc-router';

const handler = new OpenAPIHandler(orpcRouter, {
  plugins: [new CORSPlugin(), new ZodSmartCoercionPlugin()],
  interceptors: [onError((error) => console.error(error))]
});

async function handleRequest(request: Request) {
  const context = await createTRPCContext();
  const { response } = await handler.handle(request, {
    prefix: '/api/orpc',
    context
  });

  return response ?? new Response('Not found', { status: 404 });
}

export const HEAD = handleRequest;
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
