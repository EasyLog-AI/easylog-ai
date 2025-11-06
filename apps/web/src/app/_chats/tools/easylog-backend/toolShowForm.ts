import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { showFormConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolShowForm = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...showFormConfig,
    execute: async ({ formId }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Formulier ophalen...'
        }
      });

      const client = await getEasylogClient(userId);

      const [form, error] = await tryCatch(
        client.forms.showForm({
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
            message: 'Fout bij ophalen van formulier'
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
            message: `Fout bij ophalen van formulier: ${error.message}`
          }
        });
        return `Error retrieving form: ${error.message}`;
      }

      console.log('form', form);

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Formulier opgehaald'
        }
      });

      return JSON.stringify(form, null, 2);
    }
  });
};

export default toolShowForm;
