import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { headers } from 'next/headers';
import { forbidden } from 'next/navigation';

import AgentBaseSettingsForm from '@/app/_agents/components/AgentBaseSettingsForm';
import getCurrentUser from '@/app/_auth/data/getCurrentUser';
import getQueryClient from '@/lib/react-query';
import api from '@/lib/trpc/server';

const SettingsPage = async ({
  params
}: {
  params: Promise<{
    agentSlug: string;
  }>;
}) => {
  const { agentSlug } = await params;

  const user = await getCurrentUser(await headers());

  if (!user) {
    return forbidden();
  }

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(
    api.agents.get.queryOptions({
      agentId: agentSlug
    })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="container mx-auto py-10">
        <AgentBaseSettingsForm />
      </main>
    </HydrationBoundary>
  );
};

export default SettingsPage;
