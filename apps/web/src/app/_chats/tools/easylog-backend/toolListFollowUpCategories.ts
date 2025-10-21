import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { listFollowUpCategoriesConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolListFollowUpCategories = (userId: string) => {
  return tool({
    ...listFollowUpCategoriesConfig,
    execute: async ({ page, perPage }) => {
      const client = await getEasylogClient(userId);

      const [response, error] = await tryCatch(
        client.followUpCategories.listFollowUpCategories({ page, perPage })
      );

      if (error) {
        Sentry.captureException(error);
        return `Error listing follow-up categories: ${error.message}`;
      }

      const { data, meta, links } = response;

      const summary = `Found ${meta?.total ?? 0} follow-up categories total (showing ${meta?.from ?? 0}-${meta?.to ?? 0}). Page ${meta?.currentPage ?? 1} of ${meta?.lastPage ?? 1}.`;

      return JSON.stringify(
        {
          summary,
          pagination: {
            currentPage: meta?.currentPage ?? 1,
            totalPages: meta?.lastPage ?? 1,
            perPage: meta?.perPage ?? 25,
            totalItems: meta?.total ?? 0,
            hasNextPage: links?.next != null,
            hasPrevPage: links?.prev != null
          },
          categories: data
        },
        null,
        2
      );
    }
  });
};

export default toolListFollowUpCategories;
