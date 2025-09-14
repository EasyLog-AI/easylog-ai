import { InternalChartConfig } from '../schemas/internalChartConfigSchema';

/**
 * Transforms a pie chart configuration to ensure proper multi-color display.
 *
 * CRITICAL: Pie charts MUST use:
 *
 * 1. ONE shared dataKey for ALL segments (e.g., "value" or "count")
 * 2. Different colors per segment via the values array
 *
 * Common mistakes that cause single-color pie charts:
 *
 * - Using different dataKeys per segment (e.g., positief_count, opmerking_count)
 * - Having multiple values entries with different dataKeys
 *
 * @param config - The chart configuration to transform
 * @returns Transformed configuration with corrected pie chart setup
 */
export const transformPieChartConfig = (
  config: InternalChartConfig
): InternalChartConfig => {
  // Only transform pie charts
  if (config.type !== 'pie') {
    return config;
  }

  // Available colors for pie chart segments
  const pieColors = [
    'var(--color-chart-1)',
    'var(--color-chart-2)',
    'var(--color-chart-3)',
    'var(--color-chart-4)',
    'var(--color-chart-5)',
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F59E0B' // Amber
  ];

  // Check if the configuration is already correct
  // Correct: 1 value entry, data has consistent structure
  if (config.values.length === 1) {
    const dataKey = config.values[0].dataKey;
    const hasConsistentData = config.data.every(
      (item) => typeof item === 'object' && item !== null && dataKey in item
    );

    if (hasConsistentData) {
      // Configuration is already correct, just ensure we have colors for each segment
      const updatedValues = [
        {
          ...config.values[0],
          color: config.values[0].color || pieColors[0]
        }
      ];

      return {
        ...config,
        values: updatedValues
      };
    }
  }

  // TRANSFORMATION NEEDED: Multiple value entries or inconsistent data structure
  console.warn(
    '🔧 Pie chart configuration auto-corrected: Transforming to single dataKey pattern for multi-color display',
    { originalValues: config.values, originalData: config.data }
  );

  // Case 1: Multiple value entries (common mistake)
  // Transform data to use a single "value" dataKey
  if (config.values.length > 1) {
    const transformedData = config.values.map((valueEntry, index) => {
      const dataKey = valueEntry.dataKey;
      const label = valueEntry.label;

      // Find the sum of this dataKey across all data points
      const total = config.data.reduce((sum, item) => {
        const value = (item as any)[dataKey];
        return sum + (typeof value === 'number' ? value : 0);
      }, 0);

      return {
        [config.xAxisKey]: label, // Use the label as the category
        value: total, // Use "value" as the shared dataKey
        _originalDataKey: dataKey // Store original for debugging
      };
    });

    return {
      ...config,
      data: transformedData,
      values: [
        {
          dataKey: 'value',
          label: 'Value',
          color: pieColors[0] // Base color, individual segments get their own
        }
      ]
    };
  }

  // Case 2: Single value entry but data has multiple numeric fields
  // This might be a case where data was structured incorrectly
  if (config.values.length === 1 && config.data.length > 0) {
    const firstDataPoint = config.data[0] as Record<string, any>;
    const numericKeys = Object.keys(firstDataPoint).filter(
      (key) =>
        key !== config.xAxisKey && typeof firstDataPoint[key] === 'number'
    );

    // If there are multiple numeric fields, transform them into segments
    if (numericKeys.length > 1) {
      const transformedData = numericKeys.map((key, index) => {
        // Sum up values for this key across all data points
        const total = config.data.reduce((sum, item) => {
          const value = (item as any)[key];
          return sum + (typeof value === 'number' ? value : 0);
        }, 0);

        return {
          [config.xAxisKey]:
            key
              .replace(/_/g, ' ')
              .replace(/count|total/gi, '')
              .trim() || key,
          value: total,
          _originalDataKey: key
        };
      });

      return {
        ...config,
        data: transformedData,
        values: [
          {
            dataKey: 'value',
            label: 'Value',
            color: pieColors[0]
          }
        ]
      };
    }
  }

  // Return original config if no transformation needed
  return config;
};

/**
 * Validates if a pie chart configuration will display correctly with multiple
 * colors
 *
 * @param config - The chart configuration to validate
 * @returns True if valid, false if it needs transformation
 */
export const isPieChartConfigValid = (config: InternalChartConfig): boolean => {
  if (config.type !== 'pie') {
    return true; // Not a pie chart, so valid for pie chart purposes
  }

  // Check for the correct pattern:
  // 1. Exactly one value entry
  // 2. All data points have the same dataKey
  if (config.values.length !== 1) {
    return false;
  }

  const dataKey = config.values[0].dataKey;
  return config.data.every(
    (item) => typeof item === 'object' && item !== null && dataKey in item
  );
};
