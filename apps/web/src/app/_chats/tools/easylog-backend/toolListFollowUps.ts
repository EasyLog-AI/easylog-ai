import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { listFollowUpsConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolListFollowUps = (userId: string) => {
  return tool({
    ...listFollowUpsConfig,
    execute: async () => {
      const client = await getEasylogClient(userId);

      const [followUps, error] = await tryCatch(
        client.followUps.listFollowUps()
      );

      if (error) {
        Sentry.captureException(error);
        return `Error listing follow-ups: ${error.message}`;
      }

      console.log('follow-ups', followUps);

      return JSON.stringify(followUps, null, 2);
    }
  });
};

export default toolListFollowUps;
