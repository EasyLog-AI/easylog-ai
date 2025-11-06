import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { prepareSubmissionConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolPrepareSubmission = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...prepareSubmissionConfig,
    execute: async ({ projectFormId, files }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Inzending voorbereiden...'
        }
      });
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
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: 'Fout bij voorbereiden van inzending'
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
            message: `Fout bij voorbereiden van inzending: ${error.message}`
          }
        });
        return `Error preparing submission: ${error.message}`;
      }

      console.log('prepare submission response', response);

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Inzending voorbereid'
        }
      });

      return JSON.stringify(response, null, 2);
    }
  });
};

export default toolPrepareSubmission;
