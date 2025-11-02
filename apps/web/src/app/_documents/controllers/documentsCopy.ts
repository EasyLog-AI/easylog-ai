import { z } from 'zod';

import db from '@/database/client';
import { documents } from '@/database/schema';
import { protectedProcedure } from '@/lib/trpc/procedures';

const documentsCopy = protectedProcedure
  .meta({
    route: {
      method: 'POST',
      path: '/api/orpc/documents/copy',
      tags: ['Documents'],
      summary: 'Copy a document to another agent without role associations'
    }
  })
  .input(
    z.object({
      documentId: z.string().uuid(),
      targetAgentId: z.string().uuid()
    })
  )
  .mutation(async ({ input }) => {
    // Get the source document
    const sourceDocument = await db.query.documents.findFirst({
      where: {
        id: input.documentId
      }
    });

    if (!sourceDocument) {
      throw new Error('Document not found');
    }

    const [copiedDocument] = await db
      .insert(documents)
      .values({
        name: sourceDocument.name,
        path: sourceDocument.path,
        type: sourceDocument.type,
        summary: sourceDocument.summary,
        tags: sourceDocument.tags,
        content: sourceDocument.content,
        analysis: sourceDocument.analysis,
        status: sourceDocument.status,
        agentId: input.targetAgentId
      })
      .returning();

    return copiedDocument;
  });

export default documentsCopy;
