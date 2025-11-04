import { Buffer } from 'buffer';

import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { uploadSubmissionMediaConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolUploadSubmissionMedia = (userId: string) => {
  return tool({
    ...uploadSubmissionMediaConfig,
    execute: async ({
      submissionId,
      fileName,
      fileContentBase64,
      mimeType
    }) => {
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
        return await error.response.text();
      }

      if (error) {
        Sentry.captureException(error);
        return `Error uploading submission media: ${error.message}`;
      }

      console.log('uploaded submission media', result);

      return JSON.stringify(result, null, 2);
    }
  });
};

export default toolUploadSubmissionMedia;
