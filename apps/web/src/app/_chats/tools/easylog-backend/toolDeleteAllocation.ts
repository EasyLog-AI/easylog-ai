import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { deleteAllocationConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolDeleteAllocation = (userId: string) => {
  return tool({
    ...deleteAllocationConfig,
    execute: async ({ allocationId }) => {
      const client = await getEasylogClient(userId);

      const [_, error] = await tryCatch(
        client.allocations.v2DatasourcesAllocationsAllocationIdDelete({
          allocationId
        })
      );

      if (error) {
        Sentry.captureException(error);
        return `Error getting allocations: ${error.message}`;
      }

      console.log('allocation deleted');

      return 'Allocation deleted';
    }
  });
};

export default toolDeleteAllocation;
