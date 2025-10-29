import { z } from 'zod';

export type JSONValue =
  | null
  | string
  | number
  | boolean
  | { [key: string]: JSONValue }
  | JSONValue[];

const jsonValueSchema: z.ZodType<JSONValue> = z.lazy(() =>
  z.union([
    z.null(),
    z.string(),
    z.number(),
    z.boolean(),
    z.record(z.string(), jsonValueSchema),
    z.array(jsonValueSchema)
  ])
);

export { jsonValueSchema };
