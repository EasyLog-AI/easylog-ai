import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { deleteAllocationConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolDeleteAllocation = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...deleteAllocationConfig,
    execute: async ({ allocationId }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Toewijzing verwijderen...'
        }
      });
      const client = await getEasylogClient(userId);

      const [_, error] = await tryCatch(
        client.allocations.deleteAllocation({
          allocation: allocationId
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: 'Fout bij verwijderen van toewijzing'
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
            message: `Fout bij verwijderen van toewijzing: ${error.message}`
          }
        });
        return `Error deleting allocation: ${error.message}`;
      }

      console.log('allocation deleted');

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Toewijzing verwijderd'
        }
      });

      return 'Allocation deleted';
    }
  });
};

export default toolDeleteAllocation;
