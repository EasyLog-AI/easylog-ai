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

  const agent = await db.query.agents.findFirst({
    where: {
      slug: agentSlug
    }
  });

  if (!agent) {
    return notFound();
  }

  return redirect(`/${agent.slug}/chat`);
};
