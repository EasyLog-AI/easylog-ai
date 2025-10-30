import { headers } from 'next/headers';
import { forbidden } from 'next/navigation';
import { Suspense } from 'react';

import getCurrentUser from '@/app/_auth/data/getCurrentUser';
import Header from '@/app/_shared/components/Header';

const PlatformLayout = async ({
  children,
  params
}: React.PropsWithChildren<{ params: Promise<{ agentSlug: string }> }>) => {
  const { agentSlug } = await params;

  const user = await getCurrentUser(await headers());

  if (!user) {
    throw forbidden();
  }

  return (
    <main className="flex h-svh flex-col">
      <Suspense>
        <Header user={user} agentSlug={agentSlug} />
      </Suspense>
      {children}
    </main>
  );
};

export default PlatformLayout;
