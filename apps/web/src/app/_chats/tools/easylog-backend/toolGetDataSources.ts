import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { getDataSourcesConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolGetDataSources = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...getDataSourcesConfig,
    execute: async ({ types }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Gegevensbronnen ophalen...'
        }
      });
      const client = await getEasylogClient(userId);

      const [datasources, error] = await tryCatch(
        client.datasources.listDatasources({
          types
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: 'Fout bij ophalen van gegevensbronnen'
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
            message: `Fout bij ophalen van gegevensbronnen: ${error.message}`
          }
        });
        return `Error getting datasources: ${error.message}`;
      }

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Gegevensbronnen opgehaald'
        }
      });

      return JSON.stringify(datasources, null, 2);
    }
  });
};

export default toolGetDataSources;
