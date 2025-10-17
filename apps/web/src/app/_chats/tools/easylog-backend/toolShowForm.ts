import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { showFormConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolShowForm = (userId: string) => {
  return tool({
    ...showFormConfig,
    execute: async ({ formId }) => {
      const client = await getEasylogClient(userId);

      const [form, error] = await tryCatch(
        client.forms.showForm({
          form: formId
        })
      );

      if (error) {
        Sentry.captureException(error);
        return `Error retrieving form: ${error.message}`;
      }

      console.log('form', form);

      return JSON.stringify(form, null, 2);
    }
  });
};

export default toolShowForm;
