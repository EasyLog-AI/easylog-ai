import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { listFollowUpCategoriesConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolListFollowUpCategories = (userId: string) => {
  return tool({
    ...listFollowUpCategoriesConfig,
    execute: async () => {
      const client = await getEasylogClient(userId);

      const [categories, error] = await tryCatch(
        client.followUpCategories.listFollowUpCategories()
      );

      if (error) {
        Sentry.captureException(error);
        return `Error listing follow-up categories: ${error.message}`;
      }

      console.log('follow-up categories', categories);

      return JSON.stringify(categories, null, 2);
    }
  });
};

export default toolListFollowUpCategories;
