import { NextRequest, NextResponse } from 'next/server';

import authServerClient from '@/lib/better-auth/server';

export const GET = async (req: NextRequest) => {
  const session = await authServerClient.api.getSession({
    headers: req.headers
  });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(session);
};
