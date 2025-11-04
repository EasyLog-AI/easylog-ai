import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { getProjectsOfResourceConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolGetProjectsOfResource = (userId: string) => {
  return tool({
    ...getProjectsOfResourceConfig,
    execute: async ({ resourceId, datasourceSlug }) => {
      const client = await getEasylogClient(userId);

      const [projects, error] = await tryCatch(
        client.planning.listProjectsForResource({
          resource: resourceId,
          slug: datasourceSlug
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        return await error.response.text();
      }

      if (error) {
        Sentry.captureException(error);
        return `Error getting projects of resource: ${error.message}`;
      }

      console.log('projects of resource', projects);

      return JSON.stringify(projects, null, 2);
    }
  });
};

export default toolGetProjectsOfResource;
