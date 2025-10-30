import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { createFollowUpEntryConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolCreateFollowUpEntry = (userId: string) => {
  return tool({
    ...createFollowUpEntryConfig,
    execute: async ({ followUpId, data }) => {
      const client = await getEasylogClient(userId);

      const [entry, error] = await tryCatch(
        client.followUpEntries.createFollowUpEntry({
          followUp: followUpId,
          followUpEntryInput: {
            data
          }
        })
      );

      if (error) {
        Sentry.captureException(error);
        return `Error creating follow-up entry: ${error.message}`;
      }

      console.log('created follow-up entry', entry);

      return JSON.stringify(entry, null, 2);
    }
  });
};

export default toolCreateFollowUpEntry;
