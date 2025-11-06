import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import type { EntityAllocationUpdateBulkPayloadAllocationsInner } from '@/lib/easylog/generated-client/models';
import tryCatch from '@/utils/try-catch';

import { updateMultipleAllocationsConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolUpdateMultipleAllocations = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...updateMultipleAllocationsConfig,
    execute: async ({ allocations }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Toewijzingen bijwerken...'
        }
      });
      const client = await getEasylogClient(userId);

      const allocationUpdates: EntityAllocationUpdateBulkPayloadAllocationsInner[] =
        allocations.map((allocation) => ({
          id: allocation.id,
          start: new Date(allocation.start),
          end: new Date(allocation.end),
          ...(allocation.type !== undefined && { type: allocation.type }),
          ...(allocation.comment !== undefined && {
            comment: allocation.comment
          }),
          ...(allocation.parentId !== undefined && {
            parentId: allocation.parentId
          }),
          ...(allocation.fields !== undefined && {
            fields: allocation.fields
          })
        }));

      const [updatedAllocations, error] = await tryCatch(
        client.allocations.updateMultipleAllocations({
          entityAllocationUpdateBulkPayload: {
            allocations: allocationUpdates
          }
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: 'Fout bij bijwerken van toewijzingen'
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
            message: `Fout bij bijwerken van toewijzingen: ${error.message}`
          }
        });
        return `Error updating allocations: ${error.message}`;
      }

      console.log('Updated allocations:', updatedAllocations);

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Toewijzingen bijgewerkt'
        }
      });

      return JSON.stringify(updatedAllocations, null, 2);
    }
  });
};

export default toolUpdateMultipleAllocations;
