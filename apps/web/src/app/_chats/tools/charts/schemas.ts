import { z } from 'zod';

const colorSchema = z
  .string()
  .describe(
    'Color: hex (#ff6b6b), RGB (rgb(255,107,107)), or CSS variable (var(--color-chart-1) to var(--color-chart-5))'
  )
  .nullable();

// Pie chart schema - simple segments
export const pieChartSchema = z.object({
  type: z.literal('pie'),
  segments: z
    .array(
      z.object({
        label: z.string().describe('Segment label (e.g., "Chrome", "Safari")'),
        value: z.number().describe('Numeric value for this segment'),
        color: colorSchema.describe(
          'Segment color (auto-assigned if not provided or set to null)'
        )
      })
    )
    .describe('Array of pie segments')
});

// Bar chart schema - simple categories and series
export const barChartSchema = z.object({
  type: z.literal('bar'),
  categories: z
    .array(z.string())
    .describe('X-axis labels (e.g., ["Jan", "Feb", "Mar"])'),
  series: z
    .array(
      z.object({
        name: z
          .string()
          .describe('Series name for legend (e.g., "Sales", "Profit")'),
        data: z
          .array(z.number())
          .describe('Values for each category (same order as categories)'),
        color: colorSchema.describe('Bar color')
      })
    )
    .describe('Data series - each creates a group of bars')
});

// Line chart schema - same as bar but for lines
export const lineChartSchema = z.object({
  type: z.literal('line'),
  categories: z
    .array(z.string())
    .describe('X-axis labels (e.g., ["Jan", "Feb", "Mar"])'),
  series: z
    .array(
      z.object({
        name: z
          .string()
          .describe('Line name for legend (e.g., "Users", "Sessions")'),
        data: z
          .array(z.number())
          .describe('Values for each category (same order as categories)'),
        color: colorSchema.describe('Line color')
      })
    )
    .describe('Data series - each creates a separate line')
});

// Stacked bar chart schema - same structure, stacked rendering
export const stackedBarChartSchema = z.object({
  type: z.literal('stacked-bar'),
  categories: z
    .array(z.string())
    .describe('X-axis labels (e.g., ["Q1", "Q2", "Q3"])'),
  series: z
    .array(
      z.object({
        name: z
          .string()
          .describe('Stack layer name (e.g., "Product A", "Product B")'),
        data: z
          .array(z.number())
          .describe('Values for each category (same order as categories)'),
        color: colorSchema.describe('Layer color')
      })
    )
    .describe('Data series - each creates a layer in the stack')
});

export type BarChartConfig = z.infer<typeof barChartSchema>;
export type LineChartConfig = z.infer<typeof lineChartSchema>;
export type StackedBarChartConfig = z.infer<typeof stackedBarChartSchema>;
export type PieChartConfig = z.infer<typeof pieChartSchema>;
