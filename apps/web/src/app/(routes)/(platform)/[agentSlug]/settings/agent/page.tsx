import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { headers } from 'next/headers';
import { forbidden } from 'next/navigation';

import AgentBaseSettingsForm from '@/app/_agents/components/AgentBaseSettingsForm';
import getCurrentUser from '@/app/_auth/data/getCurrentUser';
import getQueryClient from '@/lib/react-query';
import api from '@/lib/trpc/server';

const AgentSettingsPage = async ({
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
      <AgentBaseSettingsForm />
    </HydrationBoundary>
  );
};

export default AgentSettingsPage;
