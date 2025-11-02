import { createTRPCRouter } from '@/lib/trpc/trpc';

import agentRolesCreate from './controllers/agentRolesCreate';
import agentRolesDelete from './controllers/agentRolesDelete';
import agentRolesGetMany from './controllers/agentRolesGetMany';
import agentRolesUpdate from './controllers/agentRolesUpdate';

const agentRolesRouter = createTRPCRouter({
  getMany: agentRolesGetMany,
  create: agentRolesCreate,
  update: agentRolesUpdate,
  delete: agentRolesDelete
});

export default agentRolesRouter;
