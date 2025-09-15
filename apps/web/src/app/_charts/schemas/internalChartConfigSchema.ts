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
          'The color of the value, can either be a valid hex or RGB color, e.g. #000000 or rgb(0, 0, 0), or a CSS variable, e.g. var(--color-chart-1). We have 5 colors available: var(--color-chart-1), var(--color-chart-2), var(--color-chart-3), var(--color-chart-4), var(--color-chart-5). For pie charts, provide one entry per segment. For other charts, provide one entry per data series.'
        )
    })
  ),
  /**
   * Pie-only label configuration; all optional for backward compatibility.
   */
  showLabels: z.boolean().default(false).optional(),
  labelContent: z
    .enum(['percent', 'name', 'name+percent'])
    .default('name+percent')
    .optional(),
  labelPosition: z
    .enum(['auto', 'inside', 'outside'])
    .default('auto')
    .optional(),
  minSliceAngleForInside: z.number().min(0).max(360).default(18).optional(),
  showLeaderLines: z.boolean().default(true).optional(),
  labelFontSize: z.number().min(8).max(32).optional(),
  labelFontWeight: z.number().min(300).max(800).optional(),
  labelColor: z.string().optional()
});

export type InternalChartConfig = z.infer<typeof internalChartConfigSchema>;

export default internalChartConfigSchema;
