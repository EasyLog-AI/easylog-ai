import { z } from 'zod';

import { protectedProcedure } from '@/lib/trpc/procedures';

const authGetMe = protectedProcedure
  .meta({
    route: {
      method: 'GET',
      path: '/api/orpc/auth/me',
      tags: ['Auth'],
      summary: 'Get the currently authenticated user'
    }
  })
  .output(
    z.object({
      id: z.string().uuid(),
      name: z.string().nullable(),
      email: z.string().email(),
      emailVerified: z.boolean().nullable(),
      image: z.string().nullable(),
      createdAt: z.date(),
      updatedAt: z.date(),
      memories: z.array(
        z.object({
          id: z.string().uuid(),
          userId: z.string().uuid(),
          content: z.string(),
          createdAt: z.date(),
          updatedAt: z.date()
        })
      )
    })
  )
  .query(async ({ ctx }) => {
    return ctx.user;
  });

export default authGetMe;
