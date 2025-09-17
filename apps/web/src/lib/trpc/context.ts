import { headers } from 'next/headers';
import { cache } from 'react';

import getCurrentUser from '@/app/_auth/data/getCurrentUser';

const createTRPCContext = cache(async (incomingHeaders?: HeadersInit) => {
  const resolvedHeaders =
    incomingHeaders === undefined
      ? await headers()
      : incomingHeaders instanceof Headers
        ? incomingHeaders
        : new Headers(incomingHeaders);

  return {
    user: await getCurrentUser(resolvedHeaders)
  };
});

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

export default createTRPCContext;
