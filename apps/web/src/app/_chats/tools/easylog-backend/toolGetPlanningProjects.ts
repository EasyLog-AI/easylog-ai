import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { getPlanningProjectsConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolGetPlanningProjects = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...getPlanningProjectsConfig,
    execute: async ({ startDate, endDate }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Planningsprojecten ophalen...'
        }
      });
      const client = await getEasylogClient(userId);

      const [projects, error] = await tryCatch(
        client.planning.listProjects({
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: 'Fout bij ophalen van planningsprojecten'
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
            message: `Fout bij ophalen van planningsprojecten: ${error.message}`
          }
        });
        return `Error getting projects: ${error.message}`;
      }

      console.log('planning projects', projects);

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Planningsprojecten opgehaald'
        }
      });

      return JSON.stringify(projects, null, 2);
    }
  });
};

export default toolGetPlanningProjects;
