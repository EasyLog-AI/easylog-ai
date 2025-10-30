const extractRepeatingElements = (
  obj: Record<string, unknown>,
  targetName: string
): Record<string, unknown>[] => {
  const elements: Record<string, unknown>[] = [];

  // Look directly in the root content for the target element
  if (obj[targetName]) {
    const value = obj[targetName];
    if (Array.isArray(value)) {
      elements.push(...(value as Record<string, unknown>[]));
    } else {
      elements.push(value as Record<string, unknown>);
    }
  }

  return elements;
};

export default extractRepeatingElements;
