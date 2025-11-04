import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { getResourceGroupsConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolGetResourceGroups = (userId: string) => {
  return tool({
    ...getResourceGroupsConfig,
    execute: async ({ resourceId, resourceSlug }) => {
      const client = await getEasylogClient(userId);

      const [resourceGroups, error] = await tryCatch(
        client.datasources.showResourceByGroup({
          resource: resourceId,
          slug: resourceSlug
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        return await error.response.text();
      }

      if (error) {
        Sentry.captureException(error);
        return `Error getting resource groups: ${error.message}`;
      }

      console.log('resource groups', resourceGroups);

      return JSON.stringify(resourceGroups, null, 2);
    }
  });
};

export default toolGetResourceGroups;
