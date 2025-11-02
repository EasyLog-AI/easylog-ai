import { z } from 'zod';

import documentAccessControlSchema from './documentAccessControlSchema';

/** Schema for updating document properties and access control. */
const documentUpdateSchema = z.object({
  /** Document UUID */
  documentId: z.string().uuid(),

  /** Access control configuration */
  accessControl: documentAccessControlSchema
});

export type DocumentUpdate = z.infer<typeof documentUpdateSchema>;

export default documentUpdateSchema;
