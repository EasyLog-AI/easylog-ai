import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { deleteFormConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolDeleteForm = (userId: string) => {
  return tool({
    ...deleteFormConfig,
    execute: async ({ formId }) => {
      const client = await getEasylogClient(userId);

      const [, error] = await tryCatch(
        client.forms.deleteForm({
          form: formId
        })
      );

      if (error) {
        Sentry.captureException(error);
        return `Error deleting form: ${error.message}`;
      }

      console.log('deleted form', formId);

      return 'Form deleted successfully.';
    }
  });
};

export default toolDeleteForm;
