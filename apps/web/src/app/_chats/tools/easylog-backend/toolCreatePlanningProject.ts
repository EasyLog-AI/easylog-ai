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
      console.log('[toolCreatePlanningProject] Tool execution started', {
        userId,
        datasourceId,
        projectName: updateData.name,
        hasExtraData: !!updateData.extraData,
        timestamp: new Date().toISOString()
      });

      try {
        console.log('[toolCreatePlanningProject] Getting EasyLog client...');
        const client = await getEasylogClient(userId);
        console.log('[toolCreatePlanningProject] EasyLog client obtained successfully');

        const projectPayload: ProjectPayload = {
          ...updateData,
          start: new Date(updateData.start),
          end: new Date(updateData.end),
          extraData: updateData.extraData ? updateData.extraData : undefined
        };

        console.log('[toolCreatePlanningProject] Project payload prepared', {
          hasDatasourceId: !!datasourceId,
          datasourceId,
          projectName: projectPayload.name,
          startDate: projectPayload.start,
          endDate: projectPayload.end,
          timestamp: new Date().toISOString()
        });

        const apiMethod = datasourceId
          ? 'createProjectInDatasource'
          : 'createProject';

        console.log('[toolCreatePlanningProject] Calling planning API', {
          method: apiMethod,
          datasourceId: datasourceId?.toString(),
          endpoint: `client.planning.${apiMethod}`
        });

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
          console.error('[toolCreatePlanningProject] API call failed', {
            errorMessage: error.message,
            errorName: error.name,
            errorStack: error.stack,
            datasourceId,
            method: apiMethod,
            timestamp: new Date().toISOString()
          });
          Sentry.captureException(error);
          return `Error creating project: ${error.message}`;
        }

        console.log('[toolCreatePlanningProject] Successfully created project', {
          projectId: createdProjectResponse?.data?.id,
          hasResponse: !!createdProjectResponse,
          timestamp: new Date().toISOString()
        });

        console.log('[toolCreatePlanningProject] Full project response:', createdProjectResponse);

        return JSON.stringify(createdProjectResponse, null, 2);
      } catch (error) {
        console.error('[toolCreatePlanningProject] Unexpected error in tool execution', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          datasourceId,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    }
  });
};

export default toolCreatePlanningProject;
