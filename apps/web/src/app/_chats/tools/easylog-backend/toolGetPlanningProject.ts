import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { getPlanningProjectConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolGetPlanningProject = (userId: string) => {
  return tool({
    ...getPlanningProjectConfig,
    execute: async ({ projectId }) => {
      const client = await getEasylogClient(userId);

      const [project, error] = await tryCatch(
        client.planning.showProject({
          project: projectId
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        return await error.response.text();
      }

      if (error) {
        Sentry.captureException(error);
        return `Error getting project: ${error.message}`;
      }

      console.log('planning project', project);

      return JSON.stringify(project, null, 2);
    }
  });
};

export default toolGetPlanningProject;
