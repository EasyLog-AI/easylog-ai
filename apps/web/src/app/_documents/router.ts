import { createTRPCRouter } from '@/lib/trpc/trpc';

import documentsCopy from './controllers/documentsCopy';
import documentsGetMany from './controllers/documentsGetMany';
import documentsUpdateRoleAccess from './controllers/documentsUpdateRoleAccess';

const documentsRouter = createTRPCRouter({
  getMany: documentsGetMany,
  copy: documentsCopy,
  updateRoleAccess: documentsUpdateRoleAccess
});

export default documentsRouter;
