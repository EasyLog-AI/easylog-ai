import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { listSubmissionsConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolListSubmissions = (userId: string) => {
  return tool({
    ...listSubmissionsConfig,
    execute: async ({
      page,
      perPage,
      projectFormId,
      issuerId,
      from,
      to,
      with: withRelations
    }) => {
      const client = await getEasylogClient(userId);

      const [response, error] = await tryCatch(
        client.submissions.listSubmissions({
          page,
          perPage,
          projectFormId: projectFormId ?? undefined,
          issuerId: issuerId ?? undefined,
          from: from ? new Date(from) : undefined,
          to: to ? new Date(to) : undefined,
          _with: withRelations ?? undefined
        })
      );

      if (error) {
        Sentry.captureException(error);
        return `Error listing submissions: ${error.message}`;
      }

      const { data, meta, links } = response;

      const summary = `Found ${meta?.total ?? 0} submissions total (showing ${meta?.from ?? 0}-${meta?.to ?? 0}). Page ${meta?.currentPage ?? 1} of ${meta?.lastPage ?? 1}.`;

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
          submissions: data
        },
        null,
        2
      );
    }
  });
};

export default toolListSubmissions;
