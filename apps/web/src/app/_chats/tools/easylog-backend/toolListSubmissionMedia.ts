import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { listSubmissionMediaConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolListSubmissionMedia = (userId: string) => {
  return tool({
    ...listSubmissionMediaConfig,
    execute: async ({ submissionId }) => {
      const client = await getEasylogClient(userId);

      const [media, error] = await tryCatch(
        client.submissions.listSubmissionMedia({
          submission: submissionId
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        return await error.response.text();
      }

      if (error) {
        Sentry.captureException(error);
        return `Error listing submission media: ${error.message}`;
      }

      return JSON.stringify(media, null, 2);
    }
  });
};

export default toolListSubmissionMedia;
