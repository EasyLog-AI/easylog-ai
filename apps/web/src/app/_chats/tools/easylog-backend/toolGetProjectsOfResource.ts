import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import { ResponseError } from '@/lib/easylog/generated-client';
import tryCatch from '@/utils/try-catch';

import { getProjectsOfResourceConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolGetProjectsOfResource = (
  userId: string,
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...getProjectsOfResourceConfig,
    execute: async ({ resourceId, datasourceSlug }) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'Projecten van middel ophalen...'
        }
      });
      const client = await getEasylogClient(userId);

      const [projects, error] = await tryCatch(
        client.planning.listProjectsForResource({
          resource: resourceId,
          slug: datasourceSlug
        })
      );

      if (error instanceof ResponseError) {
        Sentry.captureException(error);
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'error',
            message: 'Fout bij ophalen van projecten van middel'
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
            message: `Fout bij ophalen van projecten van middel: ${error.message}`
          }
        });
        return `Error getting projects of resource: ${error.message}`;
      }

      console.log('projects of resource', projects);

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'completed',
          message: 'Projecten van middel opgehaald'
        }
      });

      return JSON.stringify(projects, null, 2);
    }
  });
};

export default toolGetProjectsOfResource;
