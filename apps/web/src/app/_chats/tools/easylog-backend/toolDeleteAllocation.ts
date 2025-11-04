import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { deleteAllocationConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolDeleteAllocation = (userId: string) => {
  return tool({
    ...deleteAllocationConfig,
    execute: async ({ allocationId }) => {
      const client = await getEasylogClient(userId);

      const [_, error] = await tryCatch(
        client.allocations.deleteAllocation({
          allocation: allocationId
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        return await error.response.text();
      }

      if (error) {
        Sentry.captureException(error);
        return `Error deleting allocation: ${error.message}`;
      }

      console.log('allocation deleted');

      return 'Allocation deleted';
    }
  });
};

export default toolDeleteAllocation;
