import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import { PhaseCreatePayload } from '@/lib/easylog/generated-client/models';
import tryCatch from '@/utils/try-catch';

import { createPlanningPhaseConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolCreatePlanningPhase = (userId: string) => {
  return tool({
    ...createPlanningPhaseConfig,
    execute: async ({ projectId, slug, start, end }) => {
      const client = await getEasylogClient(userId);

      const phaseCreatePayload: PhaseCreatePayload = {
        slug,
        start: new Date(start),
        end: new Date(end)
      };

      const [phase, error] = await tryCatch(
        client.planningPhases.createProjectPhase({
          project: projectId,
          phaseCreatePayload
        })
      );

      if (error) {
        Sentry.captureException(error);
        return `Error creating phase: ${error.message}`;
      }

      console.log('created phase', phase);

      return JSON.stringify(phase, null, 2);
    }
  });
};

export default toolCreatePlanningPhase;
