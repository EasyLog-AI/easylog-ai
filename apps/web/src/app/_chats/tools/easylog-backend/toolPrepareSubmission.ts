import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { prepareSubmissionConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolPrepareSubmission = (userId: string) => {
  return tool({
    ...prepareSubmissionConfig,
    execute: async ({ projectFormId, files }) => {
      const client = await getEasylogClient(userId);

      const [response, error] = await tryCatch(
        client.submissions.prepareSubmission({
          projectForm: projectFormId,
          prepareSubmissionRequest: {
            files
          }
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        return await error.response.text();
      }

      if (error) {
        Sentry.captureException(error);
        return `Error preparing submission: ${error.message}`;
      }

      console.log('prepare submission response', response);

      return JSON.stringify(response, null, 2);
    }
  });
};

export default toolPrepareSubmission;
