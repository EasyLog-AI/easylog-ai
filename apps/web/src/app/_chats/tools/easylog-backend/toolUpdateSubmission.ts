import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { updateSubmissionConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolUpdateSubmission = (userId: string) => {
  return tool({
    ...updateSubmissionConfig,
    execute: async ({ submissionId, data }) => {
      const client = await getEasylogClient(userId);

      const [submission, error] = await tryCatch(
        client.submissions.updateSubmission({
          submission: submissionId,
          updateSubmissionInput: {
            data
          }
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        return await error.response.text();
      }

      if (error) {
        Sentry.captureException(error);
        return `Error updating submission: ${error.message}`;
      }

      console.log('updated submission', submission);

      return JSON.stringify(submission, null, 2);
    }
  });
};

export default toolUpdateSubmission;
