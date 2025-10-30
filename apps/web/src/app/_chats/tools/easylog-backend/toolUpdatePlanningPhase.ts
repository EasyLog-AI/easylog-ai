import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import { PhaseUpdatePayload } from '@/lib/easylog/generated-client/models';
import tryCatch from '@/utils/try-catch';

import { updatePlanningPhaseConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolUpdatePlanningPhase = (userId: string) => {
  return tool({
    ...updatePlanningPhaseConfig,
    execute: async ({ phaseId, start, end }) => {
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

      if (error) {
        Sentry.captureException(error);
        return `Error updating phase: ${error.message}`;
      }

      console.log('updated phase', updatedPhaseResponse);

      return JSON.stringify(updatedPhaseResponse, null, 2);
    }
  });
};

export default toolUpdatePlanningPhase;
