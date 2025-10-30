import { tool } from 'ai';

import db from '@/database/client';

import { loadDocumentConfig } from './config';

const getToolLoadDocument = () => {
  return tool({
    ...loadDocumentConfig,
    execute: async ({ documentId }) => {
      const document = await db.query.documents.findFirst({
        where: {
          id: documentId
        }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      return JSON.stringify(document);
    }
  });
};

export default getToolLoadDocument;
