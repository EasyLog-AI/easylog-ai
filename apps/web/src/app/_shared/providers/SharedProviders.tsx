import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import Toaster from '@/app/_ui/components/Toaster/Toaster';

import TRPCReactProvider from './TRPCReactProvider';

const SharedProviders = async ({ children }: React.PropsWithChildren) => {
  return (
    <>
      <NuqsAdapter>
        <TRPCReactProvider>
          {children}
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-right"
          />
          <Toaster />
        </TRPCReactProvider>
      </NuqsAdapter>
    </>
  );
};

export default SharedProviders;
