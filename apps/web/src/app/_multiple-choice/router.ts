import { createTRPCRouter } from '@/lib/trpc/trpc';

import multipleChoiceQuestionGet from './controllers/multipleChoiceQuestionGet';
import multipleChoiceQuestionUpdate from './controllers/multipleChoiceQuestionUpdate';

const multipleChoiceQuestionsRouter = createTRPCRouter({
  get: multipleChoiceQuestionGet,
  update: multipleChoiceQuestionUpdate
});

export default multipleChoiceQuestionsRouter;
