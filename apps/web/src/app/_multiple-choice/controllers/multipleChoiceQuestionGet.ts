import multipleChoiceQuestionMiddleware from '../middleware/multipleChoiceQuestionMiddleware';

const multipleChoiceQuestionGet = multipleChoiceQuestionMiddleware
  .meta({
    openapi: {
      method: 'GET',
      path: '/multiple-choice/questions',
      tags: ['Multiple Choice'],
      summary: 'Get a multiple choice question',
      protect: true
    }
  })
  .query(async ({ ctx }) => {
    return ctx.multipleChoiceQuestion;
  });

export default multipleChoiceQuestionGet;
