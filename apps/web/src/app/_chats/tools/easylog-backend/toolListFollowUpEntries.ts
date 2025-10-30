import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { listFollowUpEntriesConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolListFollowUpEntries = (userId: string) => {
  return tool({
    ...listFollowUpEntriesConfig,
    execute: async ({ followUpId, page, perPage }) => {
      const client = await getEasylogClient(userId);

      const [response, error] = await tryCatch(
        client.followUpEntries.listFollowUpEntries({
          followUp: followUpId,
          page,
          perPage
        })
      );

      if (error) {
        Sentry.captureException(error);
        return `Error listing follow-up entries: ${error.message}`;
      }

      const { data, meta, links } = response;

      const summary = `Found ${meta?.total ?? 0} entries for follow-up ${followUpId} (showing ${meta?.from ?? 0}-${meta?.to ?? 0}). Page ${meta?.currentPage ?? 1} of ${meta?.lastPage ?? 1}.`;

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
          entries: data
        },
        null,
        2
      );
    }
  });
};

export default toolListFollowUpEntries;
