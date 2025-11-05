import * as Sentry from '@sentry/nextjs';
import { tool, UIMessageStreamWriter } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { listFollowUpEntriesConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolListFollowUpEntries = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...listFollowUpEntriesConfig,
    execute: async ({ followUpId, page, perPage }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Opvolgingsitems ophalen...'
        }
      });

      const client = await getEasylogClient(userId);

      const [response, error] = await tryCatch(
        client.followUpEntries.listFollowUpEntries({
          followUp: followUpId,
          page,
          perPage
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'completed',
            message: 'Fout bij ophalen van opvolgingsitems'
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
            status: 'completed',
            message: `Fout bij ophalen van opvolgingsitems: ${error.message}`
          }
        });
        return `Error listing follow-up entries: ${error.message}`;
      }

      const { data, meta, links } = response;

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: `${meta?.total ?? 0} opvolgingsitem${(meta?.total ?? 0) === 1 ? '' : 's'} gevonden`
        }
      });

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
