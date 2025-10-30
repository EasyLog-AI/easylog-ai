import multipleChoiceSchema from '@/app/_chats/schemas/multipleChoiceSchema';

import multipleChoiceQuestionMiddleware from '../middleware/multipleChoiceQuestionMiddleware';

const multipleChoiceQuestionGet = multipleChoiceQuestionMiddleware
  .meta({
    route: {
      method: 'GET',
      path: '/api/orpc/multiple-choice/questions',
      tags: ['Multiple Choice'],
      summary: 'Get a multiple choice question'
    }
  })
  .output(multipleChoiceSchema)
  .query(async ({ ctx }) => {
    return ctx.multipleChoiceQuestion;
  });

export default multipleChoiceQuestionGet;
