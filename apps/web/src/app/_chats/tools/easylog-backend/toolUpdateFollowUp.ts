import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { updateFollowUpConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolUpdateFollowUp = (userId: string) => {
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
        return await error.response.text();
      }

      if (error) {
        Sentry.captureException(error);
        return `Error updating follow-up: ${error.message}`;
      }

      console.log('updated follow-up', followUp);

      return JSON.stringify(followUp, null, 2);
    }
  });
};

export default toolUpdateFollowUp;
