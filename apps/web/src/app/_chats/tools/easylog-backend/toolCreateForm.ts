import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { createFormConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolCreateForm = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...createFormConfig,
    execute: async ({
      name,
      description,
      avatar,
      content,
      forceSchemaValidity
    }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: `Formulier "${name}" aanmaken...`
        }
      });
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

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: 'Fout bij aanmaken van formulier'
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
            message: `Fout bij aanmaken van formulier: ${error.message}`
          }
        });
        return `Error creating form: ${error.message}`;
      }

      console.log('created form', form);

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: `Formulier "${name}" aangemaakt`
        }
      });

      return JSON.stringify(form, null, 2);
    }
  });
};

export default toolCreateForm;
