import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { deleteFollowUpEntryConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolDeleteFollowUpEntry = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...deleteFollowUpEntryConfig,
    execute: async ({ followUpEntryId }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Opvolgingsitem verwijderen...'
        }
      });

      const client = await getEasylogClient(userId);

      const [, error] = await tryCatch(
        client.followUpEntries.deleteFollowUpEntry({
          entry: followUpEntryId
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: 'Fout bij verwijderen van opvolgingsitem'
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
            message: `Fout bij verwijderen van opvolgingsitem: ${error.message}`
          }
        });
        return `Error deleting follow-up entry: ${error.message}`;
      }

      console.log('deleted follow-up entry', followUpEntryId);

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Opvolgingsitem verwijderd'
        }
      });

      return 'Follow-up entry deleted successfully.';
    }
  });
};

export default toolDeleteFollowUpEntry;
