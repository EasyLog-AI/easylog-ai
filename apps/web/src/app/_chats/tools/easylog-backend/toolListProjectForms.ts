import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { listProjectFormsConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolListProjectForms = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...listProjectFormsConfig,
    execute: async ({ formId }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Projectformulieren ophalen...'
        }
      });

      const client = await getEasylogClient(userId);

      const [projectForms, error] = await tryCatch(
        client.forms.listFormProjectForms({
          form: formId
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: 'Fout bij ophalen van projectformulieren'
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
            message: `Fout bij ophalen van projectformulieren: ${error.message}`
          }
        });
        return `Error listing project forms: ${error.message}`;
      }

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Projectformulieren opgehaald'
        }
      });

      return JSON.stringify(projectForms, null, 2);
    }
  });
};

export default toolListProjectForms;
