import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { updateFormConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolUpdateForm = (userId: string) => {
  return tool({
    ...updateFormConfig,
    execute: async ({
      formId,
      name,
      description,
      avatar,
      content,
      forceSchemaValidity
    }) => {
      let payloadContent: string | null | undefined;

      if (content === undefined) {
        payloadContent = undefined;
      } else if (content === null) {
        payloadContent = null;
      } else if (typeof content === 'string') {
        payloadContent = content;
      } else {
        try {
          payloadContent = JSON.stringify(content);
        } catch (serializationError) {
          Sentry.captureException(serializationError);
          const message =
            serializationError instanceof Error
              ? serializationError.message
              : 'Unknown serialization error';
          return `Error serializing form content: ${message}`;
        }
      }

      const client = await getEasylogClient(userId);

      const [form, error] = await tryCatch(
        client.forms.updateForm({
          form: formId,
          updateFormInput: {
            name: name ?? undefined,
            description: description ?? undefined,
            avatar: avatar ?? undefined,
            content: payloadContent ?? undefined,
            forceSchemaValidity: forceSchemaValidity ?? undefined
          }
        })
      );

      if (error) {
        Sentry.captureException(error);
        return `Error updating form: ${error.message}`;
      }

      console.log('updated form', form);

      return JSON.stringify(form, null, 2);
    }
  });
};

export default toolUpdateForm;
