import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { showFollowUpEntryConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolShowFollowUpEntry = (userId: string) => {
  return tool({
    ...showFollowUpEntryConfig,
    execute: async ({ followUpEntryId }) => {
      const client = await getEasylogClient(userId);

      const [entry, error] = await tryCatch(
        client.followUpEntries.showFollowUpEntry({
          entry: followUpEntryId
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        return await error.response.text();
      }

      if (error) {
        Sentry.captureException(error);
        return `Error retrieving follow-up entry: ${error.message}`;
      }

      console.log('follow-up entry', entry);

      return JSON.stringify(entry, null, 2);
    }
  });
};

export default toolShowFollowUpEntry;
