import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { headers } from 'next/headers';
import { forbidden } from 'next/navigation';

import AgentRolesList from '@/app/_agents/_agent-roles/components/AgentRolesList';
import getCurrentUser from '@/app/_auth/data/getCurrentUser';
import getQueryClient from '@/lib/react-query';
import api from '@/lib/trpc/server';

const RolesSettingsPage = async ({
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
    api.agents.roles.getMany.queryOptions({
      agentId: agentSlug
    })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AgentRolesList />
    </HydrationBoundary>
  );
};

export default RolesSettingsPage;
