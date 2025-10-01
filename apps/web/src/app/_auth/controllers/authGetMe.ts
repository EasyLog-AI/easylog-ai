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
  .query(async ({ ctx }) => {
    return ctx.user;
  });

export default authGetMe;
