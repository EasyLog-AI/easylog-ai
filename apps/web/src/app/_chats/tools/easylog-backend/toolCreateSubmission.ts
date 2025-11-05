import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { createSubmissionConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolCreateSubmission = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...createSubmissionConfig,
    execute: async ({ projectFormId, formVersionId, data }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Inzending aanmaken...'
        }
      });
      const client = await getEasylogClient(userId);

      const [submission, error] = await tryCatch(
        client.submissions.persistSubmission({
          projectForm: projectFormId,
          persistSubmissionRequest: {
            data,
            formVersionId
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
            message: 'Fout bij aanmaken van inzending'
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
            message: `Fout bij aanmaken van inzending: ${error.message}`
          }
        });
        return `Error creating submission: ${error.message}`;
      }

      console.log('created submission', submission);

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Inzending aangemaakt'
        }
      });

      return JSON.stringify(submission, null, 2);
    }
  });
};

export default toolCreateSubmission;
