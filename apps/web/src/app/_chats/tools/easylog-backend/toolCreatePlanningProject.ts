import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import { ProjectBody } from '@/lib/easylog/generated-client/models';
import tryCatch from '@/utils/try-catch';

import { createPlanningProjectConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolCreatePlanningProject = (userId: string) => {
  return tool({
    ...createPlanningProjectConfig,
    execute: async ({ datasourceId, ...updateData }) => {
      const client = await getEasylogClient(userId);

      const projectBody = {
        ...updateData,
        start: new Date(updateData.start),
        end: new Date(updateData.end),
        extraData: updateData.extraData ? updateData.extraData : undefined
      } satisfies ProjectBody;

      const [createdProjectResponse, error] = await tryCatch(
        client.planning.v2DatasourcesDatasourceIdProjectPost({
          datasourceId,
          projectBody: projectBody as ProjectBody
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
