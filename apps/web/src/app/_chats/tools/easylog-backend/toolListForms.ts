import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { listFormsConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolListForms = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...listFormsConfig,
    execute: async ({ page, perPage }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Formulieren ophalen...'
        }
      });

      const client = await getEasylogClient(userId);

      const [forms, error] = await tryCatch(
        client.forms.listForms({ page, perPage })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: 'Fout bij ophalen van formulieren'
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
            message: `Fout bij ophalen van formulieren: ${error.message}`
          }
        });
        return `Error listing forms: ${error.message}`;
      }

      // Extract pagination info and forms from the paginated response
      // Note: The API already returns FormListResource without the heavy content field
      const { data, meta, links } = forms;

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: `${meta?.total ?? 0} formulier${(meta?.total ?? 0) === 1 ? '' : 'en'} gevonden`
        }
      });

      const summary = `Found ${meta?.total ?? 0} forms total (showing ${meta?.from ?? 0}-${meta?.to ?? 0}). Page ${meta?.currentPage ?? 1} of ${meta?.lastPage ?? 1}.`;

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
          forms: data
        },
        null,
        2
      );
    }
  });
};

export default toolListForms;
