import { createTRPCRouter } from '@/lib/trpc/trpc';

import agentRolesRouter from './_agent-roles/router';
import agentGet from './controllers/agentsGet';
import agentsGetMany from './controllers/agentsGetMany';
import agentsUpdate from './controllers/agentsUpdate';
import scheduleSuperAgent from './controllers/scheduleSuperAgent';

const agentsRouter = createTRPCRouter({
  get: agentGet,
  update: agentsUpdate,
  getMany: agentsGetMany,

  roles: agentRolesRouter,

  scheduleSuperAgent
});

export default agentsRouter;
