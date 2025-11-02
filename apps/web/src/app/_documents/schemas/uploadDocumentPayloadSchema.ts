import { z } from 'zod';

const uploadDocumentPayloadSchema = z.object({
  agentId: z.string().uuid(),
  allRoles: z.boolean(),
  roleIds: z.array(z.string().uuid())
});

export type UploadDocumentPayload = z.infer<
  typeof uploadDocumentPayloadSchema
>;

export default uploadDocumentPayloadSchema;
