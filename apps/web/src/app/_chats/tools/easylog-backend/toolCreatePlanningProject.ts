import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import { ProjectPayload } from '@/lib/easylog/generated-client/models';
import tryCatch from '@/utils/try-catch';

import { createPlanningProjectConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolCreatePlanningProject = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...createPlanningProjectConfig,
    execute: async ({ datasourceId, ...updateData }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Planningsproject aanmaken...'
        }
      });
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
        console.log(
          '[toolCreatePlanningProject] EasyLog client obtained successfully'
        );

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

        if (error instanceof ResponseError) {
          Sentry.captureException(error);
          messageStreamWriter?.write({
            type: 'data-executing-tool',
            id,
            data: {
              status: 'error',
              message: 'Fout bij aanmaken van planningsproject'
            }
          });
          return await error.response.text();
        }

        if (error) {
          console.error('[toolCreatePlanningProject] API call failed', {
            errorMessage: error.message,
            errorName: error.name,
            errorStack: error.stack,
            datasourceId,
            timestamp: new Date().toISOString()
          });
          Sentry.captureException(error);
          messageStreamWriter?.write({
            type: 'data-executing-tool',
            id,
            data: {
              status: 'error',
              message: `Fout bij aanmaken van planningsproject: ${error.message}`
            }
          });
          return `Error creating project: ${error.message}`;
        }

        console.log('[toolCreatePlanningProject] Successfully created project', {
          projectId: createdProjectResponse?.data?.id,
          hasResponse: !!createdProjectResponse,
          timestamp: new Date().toISOString()
        });

        console.log(
          '[toolCreatePlanningProject] Full project response:',
          createdProjectResponse
        );

        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'completed',
            message: 'Planningsproject aangemaakt'
          }
        });

        return JSON.stringify(createdProjectResponse, null, 2);
      } catch (error) {
        console.error(
          '[toolCreatePlanningProject] Unexpected error in tool execution',
          {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            datasourceId,
            timestamp: new Date().toISOString()
          }
        );
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        Sentry.captureException(error);
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'completed',
            message: `Fout bij aanmaken van planningsproject: ${message}`
          }
        });
        return `Error creating project: ${message}`;
      }
    }
  });
};

export default toolCreatePlanningProject;
