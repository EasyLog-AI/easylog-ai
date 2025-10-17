import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { showFollowUpCategoryConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolShowFollowUpCategory = (userId: string) => {
  return tool({
    ...showFollowUpCategoryConfig,
    execute: async ({ categoryId }) => {
      const client = await getEasylogClient(userId);

      const [category, error] = await tryCatch(
        client.followUpCategories.showFollowUpCategory({
          category: categoryId
        })
      );

      if (error) {
        Sentry.captureException(error);
        return `Error retrieving follow-up category: ${error.message}`;
      }

      console.log('follow-up category', category);

      return JSON.stringify(category, null, 2);
    }
  });
};

export default toolShowFollowUpCategory;
