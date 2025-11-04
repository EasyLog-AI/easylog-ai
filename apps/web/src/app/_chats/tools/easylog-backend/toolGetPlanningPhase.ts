import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { getPlanningPhaseConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolGetPlanningPhase = (userId: string) => {
  return tool({
    ...getPlanningPhaseConfig,
    execute: async ({ phaseId }) => {
      const client = await getEasylogClient(userId);

      const [phase, error] = await tryCatch(
        client.planningPhases.showProjectPhase({
          phase: phaseId
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        return await error.response.text();
      }

      if (error) {
        Sentry.captureException(error);
        return `Error getting phase: ${error.message}`;
      }

      console.log('planning phase', phase);

      return JSON.stringify(phase, null, 2);
    }
  });
};

export default toolGetPlanningPhase;
