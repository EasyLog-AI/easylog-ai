import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import { ProjectBody } from '@/lib/easylog/generated-client/models';
import tryCatch from '@/utils/try-catch';

import { updatePlanningProjectConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolUpdatePlanningProject = (userId: string) => {
  return tool({
    ...updatePlanningProjectConfig,
    execute: async ({ projectId, ...updateData }) => {
      const client = await getEasylogClient(userId);

      const projectBody = {
        ...updateData,
        start: new Date(updateData.start),
        end: new Date(updateData.end),
        extraData: updateData.extraData ? updateData.extraData : undefined
      } satisfies ProjectBody;

      const [updatedProjectResponse, error] = await tryCatch(
        client.planning.v2DatasourcesProjectsProjectIdPut({
          projectId,
          projectBody: projectBody as ProjectBody
        })
      );

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
