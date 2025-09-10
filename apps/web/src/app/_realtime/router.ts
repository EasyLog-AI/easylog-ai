import { createTRPCRouter } from '@/lib/trpc/trpc';

import createEphemeralToken from './controllers/createEphemeralToken';
import realtimeSyncMessages from './controllers/realtimeSyncMessages';

const realtimeRouter = createTRPCRouter({
  syncMessages: realtimeSyncMessages,
  createEphemeralToken: createEphemeralToken
});

export default realtimeRouter;
