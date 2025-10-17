import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { getDataSourcesConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolGetDataSources = (userId: string) => {
  return tool({
    ...getDataSourcesConfig,
    execute: async ({ types }) => {
      const client = await getEasylogClient(userId);

      const [datasources, error] = await tryCatch(
        client.datasources.listDatasources({
          types
        })
      );

      if (error) {
        Sentry.captureException(error);
        return `Error getting datasources: ${error.message}`;
      }

      console.log('datasources', datasources);

      return JSON.stringify(datasources, null, 2);
    }
  });
};

export default toolGetDataSources;
