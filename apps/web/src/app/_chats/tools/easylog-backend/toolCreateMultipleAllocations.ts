import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import { EntityAllocationBulkPayload } from '@/lib/easylog/generated-client/models';
import tryCatch from '@/utils/try-catch';

import { createMultipleAllocationsConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolCreateMultipleAllocations = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...createMultipleAllocationsConfig,
    execute: async ({ projectId, group, resources }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Toewijzingen aanmaken...'
        }
      });
      const client = await getEasylogClient(userId);

      const datasourceAllocationMultipleBody: EntityAllocationBulkPayload = {
        projectId,
        group,
        resources: resources.map((r) => ({
          ...r,
          start: new Date(r.start),
          end: new Date(r.end),
          fields: r.fields
        }))
      };

      const [allocations, error] = await tryCatch(
        client.allocations.createMultipleAllocations({
          entityAllocationBulkPayload: datasourceAllocationMultipleBody
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: 'Fout bij aanmaken van toewijzingen'
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
            message: `Fout bij aanmaken van toewijzingen: ${error.message}`
          }
        });
        return `Error creating allocations: ${error.message}`;
      }

      console.log('allocations', allocations);

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Toewijzingen aangemaakt'
        }
      });

      return JSON.stringify(allocations, null, 2);
    }
  });
};

export default toolCreateMultipleAllocations;
