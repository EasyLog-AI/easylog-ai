import z from 'zod';

/**
 * Schema for media image data streamed to the UI
 */
const mediaImageSchema = z.object({
  id: z.number().describe('Media ID'),
  uuid: z.string().describe('Media UUID'),
  name: z.string().describe('Media name'),
  fileName: z.string().describe('Original file name'),
  mimeType: z.string().describe('MIME type'),
  size: z.string().describe('Human-readable file size'),
  url: z.string().url().describe('Presigned URL for the image'),
  availableSizes: z
    .array(z.string())
    .describe('Available size conversions (e.g., thumbnail, detail, original)'),
  expiresAt: z
    .string()
    .optional()
    .nullable()
    .describe('When the presigned URL expires')
});

export default mediaImageSchema;
