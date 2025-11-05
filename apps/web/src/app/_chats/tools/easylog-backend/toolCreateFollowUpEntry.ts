import * as Sentry from '@sentry/nextjs';
import { tool, UIMessageStreamWriter } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { createFollowUpEntryConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolCreateFollowUpEntry = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...createFollowUpEntryConfig,
    execute: async ({ followUpId, data }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Opvolgingsitem aanmaken...'
        }
      });

      const client = await getEasylogClient(userId);

      const [entry, error] = await tryCatch(
        client.followUpEntries.createFollowUpEntry({
          followUp: followUpId,
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
            status: 'completed',
            message: 'Fout bij aanmaken van opvolgingsitem'
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
            status: 'completed',
            message: `Fout bij aanmaken van opvolgingsitem: ${error.message}`
          }
        });
        return `Error creating follow-up entry: ${error.message}`;
      }

      console.log('created follow-up entry', entry);

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Opvolgingsitem aangemaakt'
        }
      });

      return JSON.stringify(entry, null, 2);
    }
  });
};

export default toolCreateFollowUpEntry;
