import * as Sentry from '@sentry/nextjs';
import { tool, UIMessageStreamWriter } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { listFollowUpsConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolListFollowUps = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...listFollowUpsConfig,
    execute: async ({ page, perPage }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Opvolgingen ophalen...'
        }
      });

      const client = await getEasylogClient(userId);

      const [response, error] = await tryCatch(
        client.followUps.listFollowUps({ page, perPage })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'completed',
            message: 'Fout bij ophalen van opvolgingen'
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
            message: `Fout bij ophalen van opvolgingen: ${error.message}`
          }
        });
        return `Error listing follow-ups: ${error.message}`;
      }

      const { data, meta, links } = response;

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: `${meta?.total ?? 0} opvolging${(meta?.total ?? 0) === 1 ? '' : 'en'} gevonden`
        }
      });

      const summary = `Found ${meta?.total ?? 0} follow-ups total (showing ${meta?.from ?? 0}-${meta?.to ?? 0}). Page ${meta?.currentPage ?? 1} of ${meta?.lastPage ?? 1}.`;

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
          followUps: data
        },
        null,
        2
      );
    }
  });
};

export default toolListFollowUps;
