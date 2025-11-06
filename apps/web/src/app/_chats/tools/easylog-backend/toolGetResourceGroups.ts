import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { getResourceGroupsConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolGetResourceGroups = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...getResourceGroupsConfig,
    execute: async ({ resourceId, resourceSlug }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Middelengroepen ophalen...'
        }
      });
      const client = await getEasylogClient(userId);

      const [resourceGroups, error] = await tryCatch(
        client.datasources.showResourceByGroup({
          resource: resourceId,
          slug: resourceSlug
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: 'Fout bij ophalen van middelengroepen'
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
            message: `Fout bij ophalen van middelengroepen: ${error.message}`
          }
        });
        return `Error getting resource groups: ${error.message}`;
      }

      console.log('resource groups', resourceGroups);

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Middelengroepen opgehaald'
        }
      });

      return JSON.stringify(resourceGroups, null, 2);
    }
  });
};

export default toolGetResourceGroups;
