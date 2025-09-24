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
      title: 'My Playground',
      version: '1.0.0'
    }
  });

  return NextResponse.json(spec);
};
