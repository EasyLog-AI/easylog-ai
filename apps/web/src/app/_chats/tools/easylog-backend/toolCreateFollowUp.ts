import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { createFollowUpConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolCreateFollowUp = (userId: string) => {
  return tool({
    ...createFollowUpConfig,
    execute: async ({ name, slug, description, followUpCategoryId, icon, scheme, canUseJsonTable }) => {
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

      if (error) {
        Sentry.captureException(error);
        return `Error creating follow-up: ${error.message}`;
      }

      console.log('created follow-up', followUp);

      return JSON.stringify(followUp, null, 2);
    }
  });
};

export default toolCreateFollowUp;
