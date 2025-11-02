import * as Sentry from '@sentry/nextjs';
import { type HandleUploadBody, handleUpload } from '@vercel/blob/client';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import getCurrentUser from '@/app/_auth/data/getCurrentUser';
import uploadDocumentPayloadSchema from '@/app/_documents/schemas/uploadDocumentPayloadSchema';
import db from '@/database/client';
import { documentRoleAccess, documents } from '@/database/schema';
import { ingestDocumentJob } from '@/jobs/ingest-document/ingest-document-job';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const user = await getCurrentUser(request.headers);

        if (!user) {
          throw new Error('Unauthorized');
        }

        const payload = uploadDocumentPayloadSchema.parse(
          JSON.parse(clientPayload ?? '{}')
        );

        // Create document with agent ID
        const [document] = await db
          .insert(documents)
          .values({
            name: pathname.split('/').pop() ?? 'unknown',
            type: 'unknown',
            status: 'pending',
            agentId: payload.agentId
          })
          .returning();

        // Handle role access
        if (payload.allRoles) {
          // Grant access to all roles (agentRoleId = null)
          await db.insert(documentRoleAccess).values({
            documentId: document.id,
            agentRoleId: null
          });
        } else if (payload.roleIds.length > 0) {
          // Grant access to specific roles
          await db.insert(documentRoleAccess).values(
            payload.roleIds.map((roleId) => ({
              documentId: document.id,
              agentRoleId: roleId
            }))
          );
        }

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
