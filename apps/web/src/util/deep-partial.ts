/**
 * Create a type from an object with all keys and nested keys set to optional.
 *
 * This utility type recursively makes all properties optional, including nested
 * objects. It handles various types including primitives, maps, sets, arrays,
 * and nested objects.
 */
export type DeepPartial<T> = T extends
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | symbol
  | Date
  | RegExp
  ? T
  : T extends Map<infer K, infer V>
    ? Map<K, DeepPartial<V>>
    : T extends Set<infer U>
      ? Set<DeepPartial<U>>
      : T extends Array<infer U>
        ? Array<DeepPartial<U>>
        : T extends object
          ? { [K in keyof T]?: DeepPartial<T[K]> }
          : T;
