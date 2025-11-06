import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { deleteSubmissionConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolDeleteSubmission = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...deleteSubmissionConfig,
    execute: async ({ submissionId }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Inzending verwijderen...'
        }
      });
      const client = await getEasylogClient(userId);

      const [, error] = await tryCatch(
        client.submissions.deleteSubmission({
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
            message: 'Fout bij verwijderen van inzending'
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
            message: `Fout bij verwijderen van inzending: ${error.message}`
          }
        });
        return `Error deleting submission: ${error.message}`;
      }

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Inzending verwijderd'
        }
      });

      return `Submission ${submissionId} deleted successfully`;
    }
  });
};

export default toolDeleteSubmission;
