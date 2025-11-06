import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import tryCatch from '@/utils/try-catch';

import { getResourcesConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolGetResources = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...getResourcesConfig,
    execute: async () => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Middelen ophalen...'
        }
      });
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
          messageStreamWriter?.write({
            type: 'data-executing-tool',
            id,
            data: {
              status: 'error',
              message: `Fout bij ophalen van middelen: ${error.message}`
            }
          });
          return `Error getting resources: ${error.message}`;
        }

        console.log('[toolGetResources] Successfully retrieved resources', {
          resourceCount: resources?.data?.length ?? 0,
          hasData: !!resources?.data,
          timestamp: new Date().toISOString()
        });

        console.log('[toolGetResources] Full resources response:', resources);

        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'completed',
            message: 'Middelen opgehaald'
          }
        });

        return JSON.stringify(resources, null, 2);
      } catch (error) {
        console.error('[toolGetResources] Unexpected error in tool execution', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        Sentry.captureException(error);
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'completed',
            message: `Fout bij ophalen van middelen: ${message}`
          }
        });
        return `Error getting resources: ${message}`;
      }
    }
  });
};

export default toolGetResources;
