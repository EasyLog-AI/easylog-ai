import { cache } from 'react';
import { eq, and } from 'drizzle-orm';

import db from '@/database/client';
import { memories } from '@/database/schema';
import authServerClient from '@/lib/better-auth/server';

const getCurrentUser = cache(
  async (headers: Headers, agentId?: string) => {
    const session = await authServerClient.api.getSession({
      headers
    });

    if (!session) {
      return null;
    }

    const user = await db.query.users.findFirst({
      where: {
        id: session.user.id
      },
      with: {
        memories: agentId
          ? {
              where: and(
                eq(memories.userId, session.user.id),
                eq(memories.agentId, agentId)
              )
            }
          : true
      }
    });

    if (!user) {
      return null;
    }

    return user;
  }
);

export default getCurrentUser;
