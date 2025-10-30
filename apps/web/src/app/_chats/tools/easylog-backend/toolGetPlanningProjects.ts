import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { getPlanningProjectsConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolGetPlanningProjects = (userId: string) => {
  return tool({
    ...getPlanningProjectsConfig,
    execute: async ({ startDate, endDate }) => {
      const client = await getEasylogClient(userId);

      const [projects, error] = await tryCatch(
        client.planning.listProjects({
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined
        })
      );

      if (error) {
        Sentry.captureException(error);
        return `Error getting projects: ${error.message}`;
      }

      console.log('planning projects', projects);

      return JSON.stringify(projects, null, 2);
    }
  });
};

export default toolGetPlanningProjects;
