import { inferRouterOutputs } from '@trpc/server';

import { createTRPCRouter } from '@/lib/trpc/trpc';

import authRouter from './app/_auth/router';
import chatsRouter from './app/_chats/router';
import documentsRouter from './app/_documents/router';
import multipleChoiceRouter from './app/_multiple-choice/router';
import realtimeRouter from './app/_realtime/router';

export const appRouter = createTRPCRouter({
  auth: authRouter,
  documents: documentsRouter,
  chats: chatsRouter,
  multipleChoice: multipleChoiceRouter,
  realtime: realtimeRouter
});

export type AppRouter = typeof appRouter;

export type RouterOutputs = inferRouterOutputs<AppRouter>;
