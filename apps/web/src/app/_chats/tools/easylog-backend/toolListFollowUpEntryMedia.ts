import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { listFollowUpEntryMediaConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolListFollowUpEntryMedia = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...listFollowUpEntryMediaConfig,
    execute: async ({ followUpEntryId }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Media van opvolgingsitem ophalen...'
        }
      });
      const client = await getEasylogClient(userId);

      const [media, error] = await tryCatch(
        client.followUps.listFollowUpEntryMedia({
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
            message: 'Fout bij ophalen van media van opvolgingsitem'
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
            message: `Fout bij ophalen van media van opvolgingsitem: ${error.message}`
          }
        });
        return `Error listing media of follow-up entry: ${error.message}`;
      }

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Media van opvolgingsitem opgehaald'
        }
      });

      return JSON.stringify(media, null, 2);
    }
  });
};

export default toolListFollowUpEntryMedia;
