import { OpenAPIGenerator } from '@orpc/openapi';
import { ZodToJsonSchemaConverter } from '@orpc/zod';
import { NextRequest, NextResponse } from 'next/server';

import orpcRouter from '@/orpc-router';

const openAPIGenerator = new OpenAPIGenerator({
  schemaConverters: [new ZodToJsonSchemaConverter()]
});

export const GET = async (_eq: NextRequest) => {
  const spec = await openAPIGenerator.generate(orpcRouter, {
    info: {
      title: 'Easylog AI API',
      version: '1.0.0'
    },
    security: [{ bearerAuth: [] }]
  });

  return NextResponse.json(spec);
};
