import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import { ProjectPayload } from '@/lib/easylog/generated-client/models';
import tryCatch from '@/utils/try-catch';

import { createPlanningProjectConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolCreatePlanningProject = (userId: string) => {
  return tool({
    ...createPlanningProjectConfig,
    execute: async ({ datasourceId, ...updateData }) => {
      const client = await getEasylogClient(userId);

      const projectPayload: ProjectPayload = {
        ...updateData,
        start: new Date(updateData.start),
        end: new Date(updateData.end),
        extraData: updateData.extraData ? updateData.extraData : undefined
      };

      const [createdProjectResponse, error] = await tryCatch(
        datasourceId
          ? client.planning.createProjectInDatasource({
              entity: datasourceId.toString(),
              projectPayload
            })
          : client.planning.createProject({
              projectPayload
            })
      );

      if (error) {
        Sentry.captureException(error);
        return `Error creating project: ${error.message}`;
      }

      console.log('created project', createdProjectResponse);

      return JSON.stringify(createdProjectResponse, null, 2);
    }
  });
};

export default toolCreatePlanningProject;
