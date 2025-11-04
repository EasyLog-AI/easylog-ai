import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import { ResponseError } from '@/lib/easylog/generated-client';
import { ProjectPayload } from '@/lib/easylog/generated-client/models';
import tryCatch from '@/utils/try-catch';

import { updatePlanningProjectConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolUpdatePlanningProject = (userId: string) => {
  return tool({
    ...updatePlanningProjectConfig,
    execute: async ({ projectId, ...updateData }) => {
      const client = await getEasylogClient(userId);

      const projectPayload: ProjectPayload = {
        ...updateData,
        start: new Date(updateData.start),
        end: new Date(updateData.end),
        extraData: updateData.extraData ? updateData.extraData : undefined
      };

      const [updatedProjectResponse, error] = await tryCatch(
        client.planning.updateProject({
          project: projectId,
          projectPayload
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        return await error.response.text();
      }

      if (error) {
        Sentry.captureException(error);
        return `Error updating project: ${error.message}`;
      }

      console.log('updated project', updatedProjectResponse);

      return JSON.stringify(updatedProjectResponse, null, 2);
    }
  });
};

export default toolUpdatePlanningProject;
