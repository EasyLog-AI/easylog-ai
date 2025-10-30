import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { getResourcesConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolGetResources = (userId: string) => {
  return tool({
    ...getResourcesConfig,
    execute: async () => {
      const client = await getEasylogClient(userId);

      const [resources, error] = await tryCatch(
        client.datasources.listResources()
      );

      if (error) {
        Sentry.captureException(error);
        return `Error getting resources: ${error.message}`;
      }

      console.log('resources', resources);

      return JSON.stringify(resources, null, 2);
    }
  });
};

export default toolGetResources;
