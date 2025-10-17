import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { deleteSubmissionConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolDeleteSubmission = (userId: string) => {
  return tool({
    ...deleteSubmissionConfig,
    execute: async ({ submissionId }) => {
      const client = await getEasylogClient(userId);

      const [, error] = await tryCatch(
        client.submissions.deleteSubmission({
          submission: submissionId
        })
      );

      if (error) {
        Sentry.captureException(error);
        return `Error deleting submission: ${error.message}`;
      }

      return `Submission ${submissionId} deleted successfully`;
    }
  });
};

export default toolDeleteSubmission;
