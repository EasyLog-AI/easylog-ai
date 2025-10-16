import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { createSubmissionConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolCreateSubmission = (userId: string) => {
  return tool({
    ...createSubmissionConfig,
    execute: async ({ projectFormId, formVersionId, data, checksum }) => {
      const client = await getEasylogClient(userId);

      const [submission, error] = await tryCatch(
        client.submissions.persistSubmission({
          projectForm: projectFormId,
          persistSubmissionRequest: {
            data,
            formVersionId,
            checksum
          }
        })
      );

      if (error) {
        Sentry.captureException(error);
        return `Error creating submission: ${error.message}`;
      }

      console.log('created submission', submission);

      return JSON.stringify(submission, null, 2);
    }
  });
};

export default toolCreateSubmission;
