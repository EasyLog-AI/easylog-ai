import { z } from 'zod';

const internalChartConfigSchema = z.object({
  type: z.enum(['stacked-bar', 'bar', 'line', 'pie']),
  data: z.array(
    z
      .object({})
      .catchall(z.union([z.number(), z.string()]))
      .strict()
  ),
  xAxisKey: z.string(),
  values: z.array(
    z.object({
      dataKey: z.string(),
      label: z.string(),
      color: z
        .string()
        .describe(
          'The color of the value, can either be a valid hex or RGB color, e.g. #000000 or rgb(0, 0, 0), or a CSS variable, e.g. var(--color-chart-1). We have 5 colors available: var(--color-chart-1), var(--color-chart-2), var(--color-chart-3), var(--color-chart-4), var(--color-chart-5). CRITICAL FOR PIE CHARTS: Use ONLY ONE values entry with ONE shared dataKey (e.g., "value" or "count") for ALL segments. Colors are automatically assigned per segment. For other charts, provide one entry per data series.'
        )
    })
  )
  /**
   * # PIE CHART CONFIGURATION - CRITICAL:
   *
   * CORRECT: Use ONE shared dataKey for ALL segments
   *
   * - Data: [{"category": "Type A", "value": 180}, {"category": "Type B",
   *   "value": 120}]
   * - Values: [{"dataKey": "value", "label": "Count", "color":
   *   "var(--color-chart-1)"}]
   * - XAxisKey: "category"
   *
   * INCORRECT (causes single-color bug):
   *
   * - Different dataKeys per segment (e.g., positief_count, opmerking_count)
   * - Multiple values entries with different dataKeys
   *
   * The PieChart component will automatically transform incorrect
   * configurations.
   */
});

export type InternalChartConfig = z.infer<typeof internalChartConfigSchema>;

export default internalChartConfigSchema;
