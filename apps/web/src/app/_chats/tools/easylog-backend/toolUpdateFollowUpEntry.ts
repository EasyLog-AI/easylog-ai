import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { updateFollowUpEntryConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolUpdateFollowUpEntry = (userId: string) => {
  return tool({
    ...updateFollowUpEntryConfig,
    execute: async ({ followUpEntryId, data }) => {
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
        return await error.response.text();
      }

      if (error) {
        Sentry.captureException(error);
        return `Error updating follow-up entry: ${error.message}`;
      }

      console.log('updated follow-up entry', entry);

      return JSON.stringify(entry, null, 2);
    }
  });
};

export default toolUpdateFollowUpEntry;
