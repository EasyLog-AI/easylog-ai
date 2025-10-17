import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { deleteFollowUpEntryConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolDeleteFollowUpEntry = (userId: string) => {
  return tool({
    ...deleteFollowUpEntryConfig,
    execute: async ({ followUpEntryId }) => {
      const client = await getEasylogClient(userId);

      const [, error] = await tryCatch(
        client.followUpEntries.deleteFollowUpEntry({
          entry: followUpEntryId
        })
      );

      if (error) {
        Sentry.captureException(error);
        return `Error deleting follow-up entry: ${error.message}`;
      }

      console.log('deleted follow-up entry', followUpEntryId);

      return 'Follow-up entry deleted successfully.';
    }
  });
};

export default toolDeleteFollowUpEntry;
