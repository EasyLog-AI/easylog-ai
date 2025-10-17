import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { listSubmissionsConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolListSubmissions = (userId: string) => {
  return tool({
    ...listSubmissionsConfig,
    execute: async ({
      projectFormId,
      issuerId,
      from,
      to,
      with: withRelations
    }) => {
      const client = await getEasylogClient(userId);

      const [submissions, error] = await tryCatch(
        client.submissions.listSubmissions({
          projectFormId: projectFormId ?? undefined,
          issuerId: issuerId ?? undefined,
          from: from ? new Date(from) : undefined,
          to: to ? new Date(to) : undefined,
          _with: withRelations ?? undefined
        })
      );

      if (error) {
        Sentry.captureException(error);
        return `Error listing submissions: ${error.message}`;
      }

      console.log('submissions', submissions);

      return JSON.stringify(submissions, null, 2);
    }
  });
};

export default toolListSubmissions;
