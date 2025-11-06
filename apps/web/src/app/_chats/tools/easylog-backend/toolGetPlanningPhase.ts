import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { getPlanningPhaseConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolGetPlanningPhase = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...getPlanningPhaseConfig,
    execute: async ({ phaseId }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Planningsfase ophalen...'
        }
      });
      const client = await getEasylogClient(userId);

      const [phase, error] = await tryCatch(
        client.planningPhases.showProjectPhase({
          phase: phaseId
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: 'Fout bij ophalen van planningsfase'
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
            message: `Fout bij ophalen van planningsfase: ${error.message}`
          }
        });
        return `Error getting phase: ${error.message}`;
      }

      console.log('planning phase', phase);

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Planningsfase opgehaald'
        }
      });

      return JSON.stringify(phase, null, 2);
    }
  });
};

export default toolGetPlanningPhase;
