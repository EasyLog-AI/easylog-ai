import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { showSubmissionConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolShowSubmission = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...showSubmissionConfig,
    execute: async ({ submissionId }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Inzending ophalen...'
        }
      });
      const client = await getEasylogClient(userId);

      const [submissionResponse, error] = await tryCatch(
        client.submissions.showSubmission({
          submission: submissionId
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: 'Fout bij ophalen van inzending'
          }
        });
        return await error.response.text();
      }

      if (error) {
        Sentry.captureException(error);
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: `Fout bij ophalen van inzending: ${error.message}`
          }
        });
        return `Error getting submission: ${error.message}`;
      }

      // The API returns { data: Submission }, so we unwrap it
      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Inzending opgehaald'
        }
      });

      return JSON.stringify(submissionResponse?.data, null, 2);
    }
  });
};

export default toolShowSubmission;
