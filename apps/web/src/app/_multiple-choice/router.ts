import { createTRPCRouter } from '@/lib/trpc/trpc';

import multipleChoiceQuestionGet from './controllers/multipleChoiceQuestionGet';
import multipleChoiceQuestionUpdate from './controllers/multipleChoiceQuestionUpdate';

const multipleChoiceRouter = createTRPCRouter({
  get: multipleChoiceQuestionGet,
  update: multipleChoiceQuestionUpdate
});

export default multipleChoiceRouter;
