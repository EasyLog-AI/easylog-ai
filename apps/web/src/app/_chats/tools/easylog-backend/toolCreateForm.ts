import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { createFormConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolCreateForm = (userId: string) => {
  return tool({
    ...createFormConfig,
    execute: async ({
      name,
      description,
      avatar,
      content,
      forceSchemaValidity
    }) => {
      let normalizedContent: string;

      if (content == null) {
        return 'Form content is required.';
      }

      try {
        normalizedContent =
          typeof content === 'string' ? content : JSON.stringify(content);
      } catch (serializationError) {
        Sentry.captureException(serializationError);
        const message =
          serializationError instanceof Error
            ? serializationError.message
            : 'Unknown serialization error';
        return `Error serializing form content: ${message}`;
      }

      const client = await getEasylogClient(userId);

      const [form, error] = await tryCatch(
        client.forms.createForm({
          storeFormInput: {
            name,
            description: description === undefined ? undefined : description,
            avatar: avatar === undefined ? undefined : avatar,
            content: normalizedContent,
            forceSchemaValidity:
              forceSchemaValidity === undefined
                ? undefined
                : forceSchemaValidity
          }
        })
      );

      if (error) {
        Sentry.captureException(error);
        return `Error creating form: ${error.message}`;
      }

      console.log('created form', form);

      return JSON.stringify(form, null, 2);
    }
  });
};

export default toolCreateForm;
