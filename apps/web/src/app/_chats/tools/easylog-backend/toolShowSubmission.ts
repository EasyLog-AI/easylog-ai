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

      // Debug: Check what we actually received
      console.log('[DEBUG] showSubmission response:', submission);
      console.log('[DEBUG] Type of response:', typeof submission);
      console.log('[DEBUG] Keys:', submission ? Object.keys(submission) : 'null');
      
      // If submission has a data property, return that
      if (submission && 'data' in submission && submission.data) {
        console.log('[DEBUG] Returning submission.data');
        return JSON.stringify(submission.data, null, 2);
      }
      
      // Otherwise return the whole submission
      console.log('[DEBUG] Returning full submission');
      return JSON.stringify(submission, null, 2);
    }
  });
};

export default toolShowSubmission;
