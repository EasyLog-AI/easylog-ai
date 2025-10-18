export const LABEL_TRUNCATION_THRESHOLD = 10;
export const LABEL_MAX_LENGTH = 10;
export const LABEL_SHORT_LENGTH = 3;

/**
 * Creates a tick formatter function that dynamically truncates labels. If the
 * number of categories exceeds the threshold, labels are truncated to a short
 * length. Otherwise, they are truncated to a maximum length.
 *
 * @param categories - The array of category labels.
 * @returns A function that takes a value and returns a formatted string.
 */
export const createDynamicTickFormatter =
  (categories: string[]) => (value: unknown) => {
    const valueStr = String(value);
    const categoryCount = categories.length;

    if (categoryCount > LABEL_TRUNCATION_THRESHOLD) {
      return valueStr.slice(0, LABEL_SHORT_LENGTH);
    }

    return valueStr.slice(0, LABEL_MAX_LENGTH);
  };
