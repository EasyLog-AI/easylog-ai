import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { getProjectsOfResourceConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolGetProjectsOfResource = (userId: string) => {
  return tool({
    ...getProjectsOfResourceConfig,
    execute: async ({ resourceId, datasourceSlug }) => {
      const client = await getEasylogClient(userId);

      const [projects, error] = await tryCatch(
        client.planningResources.v2DatasourcesResourcesResourceIdProjectsDatasourceSlugGet(
          {
            resourceId,
            datasourceSlug
          }
        )
      );

      if (error) {
        Sentry.captureException(error);
        return `Error getting projects: ${error.message}`;
      }

      console.log('projects of resource', projects);

      return JSON.stringify(projects, null, 2);
    }
  });
};

export default toolGetProjectsOfResource;
