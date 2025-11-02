import { z } from 'zod';

const uploadDocumentPayloadSchema = z.array(
  z.object({
    agentId: z.string(),
    roleId: z.string().nullable().optional()
  })
);

export type UploadDocumentPayload = z.infer<typeof uploadDocumentPayloadSchema>;

export default uploadDocumentPayloadSchema;
