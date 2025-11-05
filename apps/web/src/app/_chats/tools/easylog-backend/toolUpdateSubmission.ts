import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { updateSubmissionConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolUpdateSubmission = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...updateSubmissionConfig,
    execute: async ({ submissionId, data }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Inzending bijwerken...'
        }
      });
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
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: 'Fout bij bijwerken van inzending'
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
            message: `Fout bij bijwerken van inzending: ${error.message}`
          }
        });
        return `Error updating submission: ${error.message}`;
      }

      console.log('updated submission', submission);

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Inzending bijgewerkt'
        }
      });

      return JSON.stringify(submission, null, 2);
    }
  });
};

export default toolUpdateSubmission;
