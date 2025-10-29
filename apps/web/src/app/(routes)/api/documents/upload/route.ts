import * as Sentry from '@sentry/nextjs';
import { type HandleUploadBody, handleUpload } from '@vercel/blob/client';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import getCurrentUser from '@/app/_auth/data/getCurrentUser';
import db from '@/database/client';
import { documentAgents, documentRoles, documents } from '@/database/schema';
import { ingestDocumentJob } from '@/jobs/ingest-document/ingest-document-job';

const querySchema = z.object({
  agentIds: z
    .string()
    .transform((val) => val?.split(',').filter((id) => id.trim()))
    .optional()
    .default(''),
  roleIds: z
    .string()
    .transform((val) => val?.split(',').filter((id) => id.trim()))
    .optional()
    .default('')
});

export async function POST(request: NextRequest) {
  const { agentIds, roleIds } = querySchema.parse(
    Object.fromEntries(request.nextUrl.searchParams.entries())
  );

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const user = await getCurrentUser(request.headers);

        if (!user) {
          throw new Error('Unauthorized');
        }

        const [document] = await db
          .insert(documents)
          .values({
            name: pathname.split('/').pop() ?? 'unknown',
            type: 'unknown',
            status: 'pending'
          })
          .returning();

        const [agents, roles] = await Promise.all([
          db.query.agents.findMany({
            where: {
              id: {
                in: agentIds
              }
            }
          }),
          db.query.agentRoles.findMany({
            where: {
              id: {
                in: roleIds
              }
            }
          })
        ]);

        // Create agent associations
        const agentAssociations = agents.map((agent) => ({
          documentId: document.id,
          agentId: agent.id
        }));

        const roleAssociations = roles.map((role) => ({
          documentId: document.id,
          roleId: role.id
        }));

        // Insert associations in parallel
        await Promise.all([
          agentAssociations.length > 0
            ? db.insert(documentAgents).values(agentAssociations)
            : Promise.resolve(),
          roleAssociations.length > 0
            ? db.insert(documentRoles).values(roleAssociations)
            : Promise.resolve()
        ]);

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
