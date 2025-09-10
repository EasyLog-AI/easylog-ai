/**
 * Truncates string values in an object to a maximum of 1000 characters
 * Recursively processes nested objects and arrays
 */
const truncateStrings = (obj: unknown, maxLength: number = 1000): unknown => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return obj.length > maxLength
      ? obj.substring(0, maxLength) +
          `... (truncated ${obj.length - maxLength} characters)`
      : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => truncateStrings(item, maxLength));
  }

  if (typeof obj === 'object') {
    const truncated: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      truncated[key] = truncateStrings(value, maxLength);
    }
    return truncated;
  }

  return obj;
};

export default truncateStrings;
