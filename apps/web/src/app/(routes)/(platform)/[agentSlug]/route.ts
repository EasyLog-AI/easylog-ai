import { sql } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

import getCurrentUser from '@/app/_auth/data/getCurrentUser';
import db from '@/database/client';

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ agentSlug: string }> }
) => {
  const { agentSlug } = await params;

  const user = await getCurrentUser(request.headers);

  if (!user) {
    redirect('/sign-in');
  }

  const userDomain = user.email.split('@')[1];

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

  if (agent) {
    redirect(`/${agent.slug}/chat`);
  }

  // Fallback: Find first accessible agent
  const firstAccessibleAgent = await db.query.agents.findFirst({
    where: {
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

  if (firstAccessibleAgent) {
    redirect(`/${firstAccessibleAgent.slug}/chat`);
  }

  notFound();
};
