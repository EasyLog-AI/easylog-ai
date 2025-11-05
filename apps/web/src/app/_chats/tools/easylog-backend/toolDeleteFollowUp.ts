import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { deleteFollowUpConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolDeleteFollowUp = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...deleteFollowUpConfig,
    execute: async ({ followUpId }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Opvolging verwijderen...'
        }
      });

      const client = await getEasylogClient(userId);

      const [, error] = await tryCatch(
        client.followUps.deleteFollowUp({
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
            message: 'Fout bij verwijderen van opvolging'
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
            message: `Fout bij verwijderen van opvolging: ${error.message}`
          }
        });
        return `Error deleting follow-up: ${error.message}`;
      }

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Opvolging verwijderd'
        }
      });

      return `Follow-up ${followUpId} deleted successfully`;
    }
  });
};

export default toolDeleteFollowUp;
