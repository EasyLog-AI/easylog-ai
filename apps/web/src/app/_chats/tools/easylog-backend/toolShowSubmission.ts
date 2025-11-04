import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { showSubmissionConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolShowSubmission = (userId: string) => {
  return tool({
    ...showSubmissionConfig,
    execute: async ({ submissionId }) => {
      const client = await getEasylogClient(userId);

      const [submissionResponse, error] = await tryCatch(
        client.submissions.showSubmission({
          submission: submissionId
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        return await error.response.text();
      }

      if (error) {
        Sentry.captureException(error);
        return `Error getting submission: ${error.message}`;
      }

      // The API returns { data: Submission }, so we unwrap it
      return JSON.stringify(submissionResponse?.data, null, 2);
    }
  });
};

export default toolShowSubmission;
