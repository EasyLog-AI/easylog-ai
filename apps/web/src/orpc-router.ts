import { toORPCRouter } from '@orpc/trpc';

import { appRouter } from './trpc-router';

const orpcRouter = toORPCRouter(appRouter);

export default orpcRouter;
