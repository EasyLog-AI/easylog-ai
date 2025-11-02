import { forbidden, redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

import getCurrentUser from '@/app/_auth/data/getCurrentUser';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentSlug: string }> }
) {
  const { agentSlug } = await params;

  const user = await getCurrentUser(request.headers);

  if (!user) {
    return forbidden();
  }

  redirect(`/${agentSlug}/settings/agent`);
}
