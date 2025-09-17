import { createOpenApiNextHandler } from 'trpc-openapi';

import createTRPCContext from '@/lib/trpc/context';
import { appRouter } from '@/trpc-router';

const handler = createOpenApiNextHandler({
  router: appRouter,
  createContext: async ({ req }) => {
    const headerEntries = Object.entries(req.headers).filter(
      (entry): entry is [string, string | string[]] => typeof entry[1] !== 'undefined'
    );

    const headers = new Headers();
    for (const [key, value] of headerEntries) {
      if (Array.isArray(value)) {
        headers.set(key, value.join(', '));
      } else {
        headers.set(key, value);
      }
    }

    return createTRPCContext(headers);
  },
  onError({ error, path }) {
    if (process.env.NODE_ENV === 'development') {
      console.error('tRPC OpenAPI error', { path, error });
    }
  }
});

export const config = {
  api: {
    bodyParser: false
  }
};

export default handler;
