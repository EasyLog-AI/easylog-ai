import { Buffer } from 'buffer';

import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { uploadSubmissionMediaConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolUploadSubmissionMedia = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...uploadSubmissionMediaConfig,
    execute: async ({
      submissionId,
      fileName,
      fileContentBase64,
      mimeType
    }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Inzendingsmedium uploaden...'
        }
      });

      let file: Blob;

      try {
        const binary = Buffer.from(fileContentBase64, 'base64');

        if (typeof File !== 'undefined') {
          file = new File([binary], fileName, {
            type: mimeType ?? 'application/octet-stream'
          });
        } else {
          const blob = new Blob([binary], {
            type: mimeType ?? 'application/octet-stream'
          });
          (blob as Blob & { name: string }).name = fileName;
          file = blob;
        }
      } catch (conversionError) {
        Sentry.captureException(conversionError);
        const message =
          conversionError instanceof Error
            ? conversionError.message
            : 'Unknown file conversion error';
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'completed',
            message: `Fout bij uploaden van inzendingsmedium: ${message}`
          }
        });
        return `Error decoding file contents: ${message}`;
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
            message: 'Fout bij uploaden van inzendingsmedium'
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
            message: `Fout bij uploaden van inzendingsmedium: ${error.message}`
          }
        });
        return `Error uploading submission media: ${error.message}`;
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
