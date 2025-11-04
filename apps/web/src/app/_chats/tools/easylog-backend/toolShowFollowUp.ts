import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { showFollowUpConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolShowFollowUp = (userId: string) => {
  return tool({
    ...showFollowUpConfig,
    execute: async ({ followUpId }) => {
      const client = await getEasylogClient(userId);

      const [followUp, error] = await tryCatch(
        client.followUps.showFollowUp({
          followUp: followUpId
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        return await error.response.text();
      }

      if (error) {
        Sentry.captureException(error);
        return `Error getting follow-up: ${error.message}`;
      }

      console.log('follow-up', followUp);

      return JSON.stringify(followUp, null, 2);
    }
  });
};

export default toolShowFollowUp;
