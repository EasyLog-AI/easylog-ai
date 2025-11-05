import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { showFollowUpEntryConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolShowFollowUpEntry = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...showFollowUpEntryConfig,
    execute: async ({ followUpEntryId }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Opvolgingsitem ophalen...'
        }
      });

      const client = await getEasylogClient(userId);

      const [entry, error] = await tryCatch(
        client.followUpEntries.showFollowUpEntry({
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
            message: 'Fout bij ophalen van opvolgingsitem'
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
            message: `Fout bij ophalen van opvolgingsitem: ${error.message}`
          }
        });
        return `Error retrieving follow-up entry: ${error.message}`;
      }

      console.log('follow-up entry', entry);

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Opvolgingsitem opgehaald'
        }
      });

      return JSON.stringify(entry, null, 2);
    }
  });
};

export default toolShowFollowUpEntry;
