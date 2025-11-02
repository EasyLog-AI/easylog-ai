import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { headers } from 'next/headers';
import { forbidden } from 'next/navigation';

import getCurrentUser from '@/app/_auth/data/getCurrentUser';
import KnowledgeBaseSettings from '@/app/_documents/components/KnowledgeBaseSettings';
import getQueryClient from '@/lib/react-query';
import api from '@/lib/trpc/server';

const KnowledgeSettingsPage = async ({
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

  // Prefetch agent data for AddDocumentDialog
  void queryClient.prefetchQuery(
    api.agents.get.queryOptions({
      agentId: agentSlug
    })
  );

  void queryClient.prefetchInfiniteQuery(
    api.documents.getMany.infiniteQueryOptions(
      {
        cursor: 0,
        limit: 100,
        filter: {
          agentId: agentSlug
        }
      },
      {
        getNextPageParam: (lastPage) => lastPage.meta.nextCursor,
        getPreviousPageParam: (firstPage) => firstPage.meta.previousCursor
      }
    )
  );

  // Prefetch all documents for the AddDocumentDialog
  void queryClient.prefetchQuery(
    api.documents.getMany.queryOptions({
      cursor: 0,
      limit: 500
    })
  );

  void queryClient.prefetchQuery(
    api.agents.roles.getMany.queryOptions({
      agentId: agentSlug
    })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <KnowledgeBaseSettings />
    </HydrationBoundary>
  );
};

export default KnowledgeSettingsPage;
