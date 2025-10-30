'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  TRPCClient,
  createTRPCClient,
  httpBatchStreamLink,
  loggerLink
} from '@trpc/client';
import { createContext, useState } from 'react';
import superjson from 'superjson';

import clientConfig from '@/client.config';
import getQueryClient from '@/lib/react-query';
import { TRPCProvider } from '@/lib/trpc/browser';
import { AppRouter } from '@/trpc-router';

interface TRPCContextType {
  trpcClient: TRPCClient<AppRouter>;
  queryClient: QueryClient;
}

export const TRPCContext = createContext<TRPCContextType | undefined>(
  undefined
);

export interface TRPCReactProviderProps {}

const TRPCReactProvider = ({
  children
}: React.PropsWithChildren<TRPCReactProviderProps>) => {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === 'development' ||
            (op.direction === 'down' && op.result instanceof Error)
        }),
        httpBatchStreamLink({
          transformer: superjson,
          url:
            typeof window !== 'undefined'
              ? '/api/trpc'
              : new URL('/api/trpc', clientConfig.appUrl).toString()
        })
      ]
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <TRPCContext.Provider
          value={{
            trpcClient,
            queryClient
          }}
        >
          {children}
        </TRPCContext.Provider>
      </TRPCProvider>
    </QueryClientProvider>
  );
};

export default TRPCReactProvider;
