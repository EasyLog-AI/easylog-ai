import { UIMessageStreamWriter, tool } from 'ai';

import internalChartConfigSchema from '@/app/_charts/schemas/internalChartConfigSchema';

const toolCreateChart = (messageStreamWriter: UIMessageStreamWriter) => {
  return tool({
    description: `Create charts from data. Types: 'bar', 'stacked-bar', 'line', 'pie'.

CRITICAL: Each value entry needs a UNIQUE dataKey that exists in your data.

BAR/LINE/STACKED-BAR: Each value = different data series (different dataKeys)
PIE: For multi-color, each value = different segment (different dataKeys per segment)

STRUCTURE:
- data: Array of objects with xAxisKey + all dataKeys from values
- xAxisKey: Field for categories/labels  
- values: [{dataKey, label, color}] - all dataKeys must be unique

COLORS: var(--color-chart-1) to var(--color-chart-5) OR hex like "#ffb3ba"

EXAMPLES:
Bar (multiple series): {"type": "bar", "xAxisKey": "month", "data": [{"month": "Jan", "sales": 100, "profit": 20}], "values": [{"dataKey": "sales", "label": "Sales", "color": "#ff6b6b"}, {"dataKey": "profit", "label": "Profit", "color": "#4ecdc4"}]}

Pie (multi-color): {"type": "pie", "xAxisKey": "browser", "data": [{"browser": "Chrome", "chrome": 65}, {"browser": "Safari", "safari": 18}], "values": [{"dataKey": "chrome", "label": "Chrome", "color": "#ff6b6b"}, {"dataKey": "safari", "label": "Safari", "color": "#4ecdc4"}]}`,
    inputSchema: internalChartConfigSchema,
    execute: async (config, opts) => {
      messageStreamWriter.write({
        type: 'data-chart',
        id: opts.toolCallId,
        data: config
      });

      return 'Chart created successfully';
    }
  });
};

export default toolCreateChart;
