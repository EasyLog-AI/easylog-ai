import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import getCurrentUser from '@/app/_auth/data/getCurrentUser';
import NavigationMenu from '@/app/_ui/components/NavigationMenu/NavigationMenu';
import NavigationMenuItem from '@/app/_ui/components/NavigationMenu/NavigationMenuItem';
import NavigationMenuProvider from '@/app/_ui/components/NavigationMenu/NavigationMenuProvider';
import db from '@/database/client';
import getQueryClient from '@/lib/react-query';
import api from '@/lib/trpc/server';

const SettingsLayout = async ({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{
    agentSlug: string;
  }>;
}) => {
  const { agentSlug } = await params;

  // Check if user has access to this agent
  const user = await getCurrentUser(await headers());

  if (!user) {
    return notFound();
  }

  const userDomain = user.email.split('@')[1];

  console.log(userDomain);

  const agent = await db.query.agents.findFirst({
    where: {
      slug: agentSlug,
      OR: [
        {
          RAW: (table) => sql`${table.allowedDomains} @> ARRAY['*']::text[]`
        },
        {
          RAW: (table) =>
            sql`${table.allowedDomains} @> ARRAY[${userDomain}]::text[]`
        }
      ]
    }
  });

  if (!agent) {
    return notFound();
  }

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(
    api.agents.get.queryOptions({
      agentId: agentSlug
    })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NavigationMenuProvider>
        <div className="border-border-muted bg-surface-primary sticky top-14 z-50 mx-auto w-full border-b">
          <div className="container">
            <NavigationMenu direction="horizontal">
              <NavigationMenuItem href={`/${agentSlug}/settings/agent`}>
                Agent
              </NavigationMenuItem>
              <NavigationMenuItem href={`/${agentSlug}/settings/roles`}>
                Rollen
              </NavigationMenuItem>
              <NavigationMenuItem href={`/${agentSlug}/settings/knowledge`}>
                Kennisbank
              </NavigationMenuItem>
            </NavigationMenu>
          </div>
        </div>
      </NavigationMenuProvider>
      <div className="container py-10">{children}</div>
    </HydrationBoundary>
  );
};

export default SettingsLayout;
