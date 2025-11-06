import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import { PhaseCreatePayload } from '@/lib/easylog/generated-client/models';
import tryCatch from '@/utils/try-catch';

import { createPlanningPhaseConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolCreatePlanningPhase = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...createPlanningPhaseConfig,
    execute: async ({ projectId, slug, start, end }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Planningsfase aanmaken...'
        }
      });
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

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: 'Fout bij aanmaken van planningsfase'
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
            message: `Fout bij aanmaken van planningsfase: ${error.message}`
          }
        });
        return `Error creating phase: ${error.message}`;
      }

      console.log('created phase', phase);

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Planningsfase aangemaakt'
        }
      });

      return JSON.stringify(phase, null, 2);
    }
  });
};

export default toolCreatePlanningPhase;
