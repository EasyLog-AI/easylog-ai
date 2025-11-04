import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { deleteFollowUpConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolDeleteFollowUp = (userId: string) => {
  return tool({
    ...deleteFollowUpConfig,
    execute: async ({ followUpId }) => {
      const client = await getEasylogClient(userId);

      const [, error] = await tryCatch(
        client.followUps.deleteFollowUp({
          followUp: followUpId
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        return await error.response.text();
      }

      if (error) {
        Sentry.captureException(error);
        return `Error deleting follow-up: ${error.message}`;
      }

      return `Follow-up ${followUpId} deleted successfully`;
    }
  });
};

export default toolDeleteFollowUp;
