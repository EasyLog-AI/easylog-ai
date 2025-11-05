import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { listFollowUpCategoriesConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolListFollowUpCategories = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...listFollowUpCategoriesConfig,
    execute: async ({ page, perPage }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Opvolgingscategorieën ophalen...'
        }
      });

      const client = await getEasylogClient(userId);

      const [response, error] = await tryCatch(
        client.followUpCategories.listFollowUpCategories({ page, perPage })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: 'Fout bij ophalen van opvolgingscategorieën'
          }
        });
        return await error.response.text();
      }

      if (error) {
        Sentry.captureException(error);
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: `Fout bij ophalen van opvolgingscategorieën: ${error.message}`
          }
        });
        return `Error listing follow-up categories: ${error.message}`;
      }

      const { data, meta, links } = response;

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: `${meta?.total ?? 0} opvolgingscategorie${(meta?.total ?? 0) === 1 ? '' : 'ën'} gevonden`
        }
      });

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
