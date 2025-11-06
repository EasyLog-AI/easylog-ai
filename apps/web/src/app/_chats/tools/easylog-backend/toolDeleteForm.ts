import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { deleteFormConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolDeleteForm = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...deleteFormConfig,
    execute: async ({ formId }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Formulier verwijderen...'
        }
      });

      const client = await getEasylogClient(userId);

      const [, error] = await tryCatch(
        client.forms.deleteForm({
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
            message: 'Fout bij verwijderen van formulier'
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
            message: `Fout bij verwijderen van formulier: ${error.message}`
          }
        });
        return `Error deleting form: ${error.message}`;
      }

      console.log('deleted form', formId);

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Formulier verwijderd'
        }
      });

      return 'Form deleted successfully.';
    }
  });
};

export default toolDeleteForm;
