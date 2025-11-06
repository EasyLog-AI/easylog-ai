import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { getPlanningPhasesConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolGetPlanningPhases = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...getPlanningPhasesConfig,
    execute: async ({ projectId }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Planningsfases ophalen...'
        }
      });
      const client = await getEasylogClient(userId);

      const [phases, error] = await tryCatch(
        client.planningPhases.listProjectPhases({
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
            message: 'Fout bij ophalen van planningsfases'
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
            message: `Fout bij ophalen van planningsfases: ${error.message}`
          }
        });
        return `Error getting phases: ${error.message}`;
      }

      console.log('planning phases', phases);

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Planningsfases opgehaald'
        }
      });

      return JSON.stringify(phases, null, 2);
    }
  });
};

export default toolGetPlanningPhases;
