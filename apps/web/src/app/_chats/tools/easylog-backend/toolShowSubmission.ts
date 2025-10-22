import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { showSubmissionConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolShowSubmission = (userId: string) => {
  return tool({
    ...showSubmissionConfig,
    execute: async ({ submissionId }) => {
      const client = await getEasylogClient(userId);

      const [submission, error] = await tryCatch(
        client.submissions.showSubmission({
          submission: submissionId
        })
      );

      if (error) {
        Sentry.captureException(error);
        return `Error getting submission: ${error.message}`;
      }

      return JSON.stringify(submission, null, 2);
    }
  });
};

export default toolShowSubmission;
