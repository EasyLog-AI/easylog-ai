import { createTRPCRouter } from '@/lib/trpc/trpc';

import realtimeSyncMessages from './controllers/realtimeSyncMessages';

const realtimeRouter = createTRPCRouter({
  syncMessages: realtimeSyncMessages
});

export default realtimeRouter;