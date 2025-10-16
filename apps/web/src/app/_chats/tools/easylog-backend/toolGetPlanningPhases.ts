import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { getPlanningPhasesConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolGetPlanningPhases = (userId: string) => {
  return tool({
    ...getPlanningPhasesConfig,
    execute: async ({ projectId }) => {
      const client = await getEasylogClient(userId);

      const [phases, error] = await tryCatch(
        client.planningPhases.listProjectPhases({
          project: projectId
        })
      );

      if (error) {
        Sentry.captureException(error);
        return `Error getting phases: ${error.message}`;
      }

      console.log('planning phases', phases);

      return JSON.stringify(phases, null, 2);
    }
  });
};

export default toolGetPlanningPhases;
