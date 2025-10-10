/**
 * Create a union of an object's values, optionally allowing specification of specific keys.
 *
 * @example
 * const data = {
 *   foo: 'hello',
 *   bar: 'world',
 *   baz: 42
 * } as const;
 *
 * type Values = ValueOf<typeof data>; // 'hello' | 'world' | 42
 * type StringValues = ValueOf<typeof data, 'foo' | 'bar'>; // 'hello' | 'world'
 */
export type ValueOf<
  ObjectType,
  ValueType extends keyof ObjectType = keyof ObjectType,
> = ObjectType[ValueType];