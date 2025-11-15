import { sql } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

import getCurrentUser from '@/app/_auth/data/getCurrentUser';
import db from '@/database/client';

export const GET = async (request: NextRequest) => {
  const user = await getCurrentUser(request.headers);

  if (!user) {
    redirect('/sign-in');
  }

  const userDomain = user.email.split('@')[1];

  // Find first agent that user has access to
  const agent = await db.query.agents.findFirst({
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

  if (agent) {
    redirect(`/${agent.slug}/chat`);
  }

  // Fallback to last chat if user has one
  const lastChat = await db.query.chats.findFirst({
    where: {
      userId: user.id
    },
    orderBy: {
      createdAt: 'desc'
    },
    with: {
      agent: true
    }
  });

  if (lastChat) {
    redirect(`/${lastChat.agent.slug}/chat`);
  }

  notFound();
};
