import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { updateFollowUpEntryConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolUpdateFollowUpEntry = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...updateFollowUpEntryConfig,
    execute: async ({ followUpEntryId, data }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Opvolgingsitem bijwerken...'
        }
      });

      const client = await getEasylogClient(userId);

      const [entry, error] = await tryCatch(
        client.followUpEntries.updateFollowUpEntry({
          entry: followUpEntryId,
          followUpEntryInput: {
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
            message: 'Fout bij bijwerken van opvolgingsitem'
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
            message: `Fout bij bijwerken van opvolgingsitem: ${error.message}`
          }
        });
        return `Error updating follow-up entry: ${error.message}`;
      }

      console.log('updated follow-up entry', entry);

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Opvolgingsitem bijgewerkt'
        }
      });

      return JSON.stringify(entry, null, 2);
    }
  });
};

export default toolUpdateFollowUpEntry;
