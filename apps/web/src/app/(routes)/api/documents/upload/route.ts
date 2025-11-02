import * as Sentry from '@sentry/nextjs';
import { type HandleUploadBody, handleUpload } from '@vercel/blob/client';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import getCurrentUser from '@/app/_auth/data/getCurrentUser';
import uploadDocumentPayloadSchema from '@/app/_documents/schemas/uploadDocumentPayloadSchema';
import db from '@/database/client';
import { documentAccess, documents } from '@/database/schema';
import { ingestDocumentJob } from '@/jobs/ingest-document/ingest-document-job';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request.headers);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const accessControlList = uploadDocumentPayloadSchema.parse(
          JSON.parse(clientPayload ?? '{}')
        );

        const [document] = await db
          .insert(documents)
          .values({
            name: pathname.split('/').pop() ?? 'unknown',
            type: 'unknown',
            status: 'pending'
          })
          .returning();

        await db.insert(documentAccess).values(
          accessControlList.map((access) => ({
            documentId: document.id,
            agentId: access.agentId,
            agentRoleId: access.roleId
          }))
        );

        return {
          allowedContentTypes: [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/xml',
            'text/xml'
          ],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            documentId: document.id
          })
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const { documentId } = z
          .object({
            documentId: z.string()
          })
          .parse(JSON.parse(tokenPayload ?? '{}'));

        await db
          .update(documents)
          .set({
            path: blob.pathname
          })
          .where(eq(documents.id, documentId));

        await ingestDocumentJob.trigger({
          documentId
        });
      }
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
