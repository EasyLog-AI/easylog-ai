import * as Sentry from '@sentry/nextjs';
import { tool, UIMessageStreamWriter } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { createFollowUpConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolCreateFollowUp = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...createFollowUpConfig,
    execute: async ({
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
          message: `Opvolging "${name}" aanmaken...`
        }
      });

      const client = await getEasylogClient(userId);

      const [followUp, error] = await tryCatch(
        client.followUps.createFollowUp({
          storeFollowUpInput: {
            name,
            slug,
            description: description ?? null,
            followUpCategoryId: followUpCategoryId ?? null,
            icon: icon ?? null,
            scheme,
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
            message: 'Fout bij aanmaken van opvolging'
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
            message: `Fout bij aanmaken van opvolging: ${error.message}`
          }
        });
        return `Error creating follow-up: ${error.message}`;
      }

      console.log('created follow-up', followUp);

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: `Opvolging "${name}" aangemaakt`
        }
      });

      return JSON.stringify(followUp, null, 2);
    }
  });
};

export default toolCreateFollowUp;
