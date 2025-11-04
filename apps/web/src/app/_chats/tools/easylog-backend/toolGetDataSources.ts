import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { getDataSourcesConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolGetDataSources = (userId: string) => {
  return tool({
    ...getDataSourcesConfig,
    execute: async ({ types }) => {
      console.log('[toolGetDataSources] Tool execution started', {
        userId,
        types,
        timestamp: new Date().toISOString()
      });

      try {
        console.log('[toolGetDataSources] Getting EasyLog client...');
        const client = await getEasylogClient(userId);
        console.log('[toolGetDataSources] EasyLog client obtained successfully');

        console.log('[toolGetDataSources] Calling listDatasources API', {
          types,
          endpoint: 'client.datasources.listDatasources'
        });

        const [datasources, error] = await tryCatch(
          client.datasources.listDatasources({
            types
          })
        );

        if (error) {
          console.error('[toolGetDataSources] API call failed', {
            errorMessage: error.message,
            errorName: error.name,
            errorStack: error.stack,
            timestamp: new Date().toISOString()
          });
          Sentry.captureException(error);
          return `Error getting datasources: ${error.message}`;
        }

        console.log('[toolGetDataSources] Successfully retrieved datasources', {
          datasourceCount: datasources?.data?.length ?? 0,
          hasData: !!datasources?.data,
          timestamp: new Date().toISOString()
        });

        console.log('[toolGetDataSources] Full datasources response:', datasources);

        return JSON.stringify(datasources, null, 2);
      } catch (error) {
        console.error('[toolGetDataSources] Unexpected error in tool execution', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    }
  });
};

export default toolGetDataSources;
