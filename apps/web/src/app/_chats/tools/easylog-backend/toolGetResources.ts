import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { getResourcesConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolGetResources = (userId: string) => {
  return tool({
    ...getResourcesConfig,
    execute: async () => {
      console.log('[toolGetResources] Tool execution started', {
        userId,
        timestamp: new Date().toISOString()
      });

      try {
        console.log('[toolGetResources] Getting EasyLog client...');
        const client = await getEasylogClient(userId);
        console.log('[toolGetResources] EasyLog client obtained successfully');

        console.log('[toolGetResources] Calling listResources API', {
          endpoint: 'client.datasources.listResources'
        });

        const [resources, error] = await tryCatch(
          client.datasources.listResources()
        );

        if (error) {
          console.error('[toolGetResources] API call failed', {
            errorMessage: error.message,
            errorName: error.name,
            errorStack: error.stack,
            timestamp: new Date().toISOString()
          });
          Sentry.captureException(error);
          return `Error getting resources: ${error.message}`;
        }

        console.log('[toolGetResources] Successfully retrieved resources', {
          resourceCount: resources?.data?.length ?? 0,
          hasData: !!resources?.data,
          timestamp: new Date().toISOString()
        });

        console.log('[toolGetResources] Full resources response:', resources);

        return JSON.stringify(resources, null, 2);
      } catch (error) {
        console.error('[toolGetResources] Unexpected error in tool execution', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    }
  });
};

export default toolGetResources;
