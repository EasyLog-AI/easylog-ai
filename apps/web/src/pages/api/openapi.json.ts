import type { NextApiRequest, NextApiResponse } from 'next';

import { createOpenApiDocument } from '@/lib/trpc/openapi';

const resolveHeaderValue = (value: string | string[] | undefined) => {
  if (!value) {
    return undefined;
  }

  return Array.isArray(value) ? value[0] : value;
};

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  const protocol = resolveHeaderValue(req.headers['x-forwarded-proto']) ?? 'http';
  const host = resolveHeaderValue(req.headers['x-forwarded-host']) ?? resolveHeaderValue(req.headers.host) ?? 'localhost:3000';
  const baseUrl = `${protocol}://${host}/api/openapi`;
  const document = createOpenApiDocument(baseUrl);

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json(document);
};

export default handler;
