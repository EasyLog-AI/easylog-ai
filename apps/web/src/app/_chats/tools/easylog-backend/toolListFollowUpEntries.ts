import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { listFollowUpEntriesConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolListFollowUpEntries = (userId: string) => {
  return tool({
    ...listFollowUpEntriesConfig,
    execute: async ({ followUpId }) => {
      const client = await getEasylogClient(userId);

      const [entries, error] = await tryCatch(
        client.followUpEntries.listFollowUpEntries({
          followUp: followUpId
        })
      );

      if (error) {
        Sentry.captureException(error);
        return `Error listing follow-up entries: ${error.message}`;
      }

      console.log('follow-up entries', entries);

      return JSON.stringify(entries, null, 2);
    }
  });
};

export default toolListFollowUpEntries;
