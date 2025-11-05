import * as Sentry from '@sentry/nextjs';
import { tool, UIMessageStreamWriter } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { updateFollowUpConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolUpdateFollowUp = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...updateFollowUpConfig,
    execute: async ({
      followUpId,
      name,
      slug,
      description,
      followUpCategoryId,
      icon,
      scheme,
      canUseJsonTable
    }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Opvolging bijwerken...'
        }
      });

      const client = await getEasylogClient(userId);

      const [followUp, error] = await tryCatch(
        client.followUps.updateFollowUp({
          followUp: followUpId,
          updateFollowUpInput: {
            name: name ?? null,
            slug: slug ?? null,
            description: description ?? null,
            followUpCategoryId: followUpCategoryId ?? null,
            icon: icon ?? null,
            scheme: scheme ?? null,
            canUseJsonTable: canUseJsonTable ?? null
          }
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'completed',
            message: 'Fout bij bijwerken van opvolging'
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
            status: 'completed',
            message: `Fout bij bijwerken van opvolging: ${error.message}`
          }
        });
        return `Error updating follow-up: ${error.message}`;
      }

      console.log('updated follow-up', followUp);

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Opvolging bijgewerkt'
        }
      });

      return JSON.stringify(followUp, null, 2);
    }
  });
};

export default toolUpdateFollowUp;
