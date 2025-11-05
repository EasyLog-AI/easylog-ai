import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { getPlanningProjectConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolGetPlanningProject = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...getPlanningProjectConfig,
    execute: async ({ projectId }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Planningsproject ophalen...'
        }
      });
      const client = await getEasylogClient(userId);

      const [project, error] = await tryCatch(
        client.planning.showProject({
          project: projectId
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: 'Fout bij ophalen van planningsproject'
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
            message: `Fout bij ophalen van planningsproject: ${error.message}`
          }
        });
        return `Error getting project: ${error.message}`;
      }

      console.log('planning project', project);

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Planningsproject opgehaald'
        }
      });

      return JSON.stringify(project, null, 2);
    }
  });
};

export default toolGetPlanningProject;
