import { protectedProcedure } from '@/lib/trpc/procedures';

const authGetMe = protectedProcedure
  .meta({
    openapi: {
      method: 'GET',
      path: '/auth/me',
      tags: ['Auth'],
      summary: 'Get the currently authenticated user',
      protect: true
    }
  })
  .query(async ({ ctx }) => {
    return ctx.user;
  });

export default authGetMe;
