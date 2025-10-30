import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { listProjectFormsConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolListProjectForms = (userId: string) => {
  return tool({
    ...listProjectFormsConfig,
    execute: async ({ formId }) => {
      const client = await getEasylogClient(userId);

      const [projectForms, error] = await tryCatch(
        client.forms.listFormProjectForms({
          form: formId
        })
      );

      if (error) {
        Sentry.captureException(error);
        return `Error listing project forms: ${error.message}`;
      }

      return JSON.stringify(projectForms, null, 2);
    }
  });
};

export default toolListProjectForms;
