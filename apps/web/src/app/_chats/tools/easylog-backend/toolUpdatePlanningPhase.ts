import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import { PhaseUpdatePayload } from '@/lib/easylog/generated-client/models';
import tryCatch from '@/utils/try-catch';

import { updatePlanningPhaseConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolUpdatePlanningPhase = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...updatePlanningPhaseConfig,
    execute: async ({ phaseId, start, end }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Planningsfase bijwerken...'
        }
      });
      const client = await getEasylogClient(userId);

      const phaseUpdatePayload: PhaseUpdatePayload = {
        start: new Date(start),
        end: new Date(end)
      };

      const [updatedPhaseResponse, error] = await tryCatch(
        client.planningPhases.updateProjectPhase({
          phase: phaseId,
          phaseUpdatePayload
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: 'Fout bij bijwerken van planningsfase'
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
            message: `Fout bij bijwerken van planningsfase: ${error.message}`
          }
        });
        return `Error updating phase: ${error.message}`;
      }

      console.log('updated phase', updatedPhaseResponse);

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Planningsfase bijgewerkt'
        }
      });

      return JSON.stringify(updatedPhaseResponse, null, 2);
    }
  });
};

export default toolUpdatePlanningPhase;
