import { Buffer } from 'buffer';

import * as Sentry from '@sentry/nextjs';
import { FileUIPart, UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { uploadSubmissionMediaConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';
import { ChatMessage } from '../../types';

const toolUploadSubmissionMedia = (
  userId: string,
  messageHistory: ChatMessage[],
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...uploadSubmissionMediaConfig,
    execute: async ({ submissionId, fileName }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Media van inzending uploaden...'
        }
      });

      const filePart = messageHistory
        .toReversed()
        .flatMap((message) => message.parts)
        .find(
          (part): part is FileUIPart =>
            part.type === 'file' && part.filename === fileName
        ) as FileUIPart | undefined;

      if (!filePart) {
        Sentry.captureException(
          new Error(`File ${fileName} not found in message history`)
        );
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: `Bestand ${fileName} niet gevonden in berichtgeschiedenis`
          }
        });
        return `Bestand ${fileName} niet gevonden in berichtgeschiedenis`;
      }

      const base64Content = filePart.url.split(',')[1];

      const [file, fileConversionError] = await tryCatch(async () => {
        const binary = Buffer.from(base64Content, 'base64');

        return new File([binary], fileName, {
          type: filePart.mediaType
        });
      });

      if (fileConversionError) {
        Sentry.captureException(fileConversionError);
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: `Fout bij converteren van bestand: ${fileConversionError.message}`
          }
        });
        return `Fout bij converteren van bestand: ${fileConversionError.message}`;
      }

      const client = await getEasylogClient(userId);

      const [result, error] = await tryCatch(
        client.submissions.uploadSubmissionMedia({
          submission: submissionId,
          file
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: 'Fout bij uploaden van media van inzending'
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
            message: `Fout bij uploaden van media van inzending: ${error.message}`
          }
        });
        return `Error uploading media of submission: ${error.message}`;
      }

      console.log('uploaded submission media', result);

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Inzendingsmedium geüpload'
        }
      });

      return JSON.stringify(result, null, 2);
    }
  });
};

export default toolUploadSubmissionMedia;
