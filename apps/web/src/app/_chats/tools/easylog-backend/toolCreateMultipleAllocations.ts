import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import { EntityAllocationBulkPayload } from '@/lib/easylog/generated-client/models';
import tryCatch from '@/utils/try-catch';

import { createMultipleAllocationsConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolCreateMultipleAllocations = (userId: string) => {
  return tool({
    ...createMultipleAllocationsConfig,
    execute: async ({ projectId, group, resources }) => {
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

      if (error) {
        Sentry.captureException(error);
        return `Error creating allocations: ${error.message}`;
      }

      console.log('allocations', allocations);

      return JSON.stringify(allocations, null, 2);
    }
  });
};

export default toolCreateMultipleAllocations;
