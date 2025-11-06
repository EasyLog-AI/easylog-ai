import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import { ProjectPayload } from '@/lib/easylog/generated-client/models';
import tryCatch from '@/utils/try-catch';

import { updatePlanningProjectConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolUpdatePlanningProject = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...updatePlanningProjectConfig,
    execute: async ({ projectId, ...updateData }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Planningsproject bijwerken...'
        }
      });
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
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: 'Fout bij bijwerken van planningsproject'
          }
        });
        return await error.response.text();
      }

      if (error) {
        Sentry.captureException(error);
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: `Fout bij bijwerken van planningsproject: ${error.message}`
          }
        });
        return `Error updating project: ${error.message}`;
      }

      console.log('updated project', updatedProjectResponse);

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Planningsproject bijgewerkt'
        }
      });

      return JSON.stringify(updatedProjectResponse, null, 2);
    }
  });
};

export default toolUpdatePlanningProject;
