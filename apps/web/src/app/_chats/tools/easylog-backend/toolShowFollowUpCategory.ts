import * as Sentry from '@sentry/nextjs';
import { tool, UIMessageStreamWriter } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { showFollowUpCategoryConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolShowFollowUpCategory = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...showFollowUpCategoryConfig,
    execute: async ({ categoryId }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Opvolgingscategorie ophalen...'
        }
      });

      const client = await getEasylogClient(userId);

      const [category, error] = await tryCatch(
        client.followUpCategories.showFollowUpCategory({
          category: categoryId
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'completed',
            message: 'Fout bij ophalen van opvolgingscategorie'
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
            message: `Fout bij ophalen van opvolgingscategorie: ${error.message}`
          }
        });
        return `Error retrieving follow-up category: ${error.message}`;
      }

      console.log('follow-up category', category);

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Opvolgingscategorie opgehaald'
        }
      });

      return JSON.stringify(category, null, 2);
    }
  });
};

export default toolShowFollowUpCategory;
