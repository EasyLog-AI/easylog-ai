import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { listSubmissionMediaConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolListSubmissionMedia = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...listSubmissionMediaConfig,
    execute: async ({ submissionId }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Media van inzending ophalen...'
        }
      });
      const client = await getEasylogClient(userId);

      const [media, error] = await tryCatch(
        client.submissions.listSubmissionMedia({
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
            message: 'Fout bij ophalen van media van inzending'
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
            message: `Fout bij ophalen van media van inzending: ${error.message}`
          }
        });
        return `Error listing media of submission: ${error.message}`;
      }

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Media van inzending opgehaald'
        }
      });

      return JSON.stringify(media, null, 2);
    }
  });
};

export default toolListSubmissionMedia;
