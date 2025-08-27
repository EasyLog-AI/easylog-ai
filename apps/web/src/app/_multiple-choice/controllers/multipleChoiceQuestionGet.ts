import multipleChoiceQuestionMiddleware from '../middleware/multipleChoiceQuestionMiddleware';

const multipleChoiceQuestionGet = multipleChoiceQuestionMiddleware.query(
  async ({ ctx }) => {
    return ctx.multipleChoiceQuestion;
  }
);

export default multipleChoiceQuestionGet;
