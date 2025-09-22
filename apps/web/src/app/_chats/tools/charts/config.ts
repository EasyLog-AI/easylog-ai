import internalChartConfigSchema from '@/app/_charts/schemas/internalChartConfigSchema';

export const createChartConfig = {
  name: 'createChart',
  description: `Create charts from data. Types: 'bar', 'stacked-bar', 'line', 'pie'.

CRITICAL: Each value entry needs a UNIQUE dataKey that exists in your data.

BAR/LINE/STACKED-BAR: Each value = different data series (different dataKeys)
PIE: For multi-color, each segment needs its OWN dataKey in data (e.g., "chrome_users", "safari_users")

STRUCTURE:
- data: Array of objects with xAxisKey + all dataKeys from values
- xAxisKey: Field for categories/labels  
- values: [{dataKey, label, color}] - all dataKeys must be unique

COLORS: var(--color-chart-1) to var(--color-chart-5) OR hex like "#ffb3ba"

EXAMPLES:
Bar (multiple series): {"type": "bar", "xAxisKey": "month", "data": [{"month": "Jan", "sales": 100, "profit": 20}], "values": [{"dataKey": "sales", "label": "Sales", "color": "#ff6b6b"}, {"dataKey": "profit", "label": "Profit", "color": "#4ecdc4"}]}

Multi-color Pie (CRITICAL - each segment needs unique dataKey): {"type": "pie", "xAxisKey": "browser", "data": [{"browser": "Chrome", "chrome_users": 65}, {"browser": "Safari", "safari_users": 18}], "values": [{"dataKey": "chrome_users", "label": "Chrome", "color": "#ff6b6b"}, {"dataKey": "safari_users", "label": "Safari", "color": "#4ecdc4"}]}

Single-color Pie (all segments same dataKey): {"type": "pie", "xAxisKey": "browser", "data": [{"browser": "Chrome", "users": 65}, {"browser": "Safari", "users": 18}], "values": [{"dataKey": "users", "label": "Users", "color": "#ff6b6b"}]}`,
  inputSchema: internalChartConfigSchema
} as const;
