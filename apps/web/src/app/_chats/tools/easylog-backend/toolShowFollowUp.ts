import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { showFollowUpConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolShowFollowUp = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...showFollowUpConfig,
    execute: async ({ followUpId }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Opvolging ophalen...'
        }
      });

      const client = await getEasylogClient(userId);

      const [followUp, error] = await tryCatch(
        client.followUps.showFollowUp({
          followUp: followUpId
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: 'Fout bij ophalen van opvolging'
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
            message: `Fout bij ophalen van opvolging: ${error.message}`
          }
        });
        return `Error getting follow-up: ${error.message}`;
      }

      console.log('follow-up', followUp);

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Opvolging opgehaald'
        }
      });

      return JSON.stringify(followUp, null, 2);
    }
  });
};

export default toolShowFollowUp;
