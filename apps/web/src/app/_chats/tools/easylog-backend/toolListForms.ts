import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { listFormsConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolListForms = (userId: string) => {
  return tool({
    ...listFormsConfig,
    execute: async () => {
      const client = await getEasylogClient(userId);

      const [forms, error] = await tryCatch(client.forms.listForms());

      if (error) {
        Sentry.captureException(error);
        return `Error listing forms: ${error.message}`;
      }

      console.log('forms', forms);

      return JSON.stringify(forms, null, 2);
    }
  });
};

export default toolListForms;
