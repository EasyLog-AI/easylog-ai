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

      /**
       * Return only essential fields without the large content field to prevent
       * token limit issues. The agent should use showForm() to get the full
       * form details when needed.
       */
      const formsSummary = forms?.data?.map((form) => ({
        id: form.id,
        name: form.name,
        description: form.description,
        avatar: form.avatar,
        clientId: form.clientId,
        hasActions: form.hasActions,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        accessedAt: form.accessedAt
        // Exclude 'content' field to reduce payload size
      }));

      return JSON.stringify({ data: formsSummary }, null, 2);
    }
  });
};

export default toolListForms;
