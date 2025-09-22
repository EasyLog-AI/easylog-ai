import {
  barChartSchema,
  lineChartSchema,
  pieChartSchema,
  stackedBarChartSchema
} from './schemas';

export const createBarChartConfig = {
  name: 'createBarChart',
  description: `Create a bar chart with simple categories and series.

STRUCTURE:
- categories: Array of x-axis labels
- series: Array of data series, each with name, data values, and optional color

EXAMPLE:
{"type": "bar", "categories": ["Jan", "Feb", "Mar"], "series": [{"name": "Sales", "data": [100, 120, 90], "color": "#ff6b6b"}, {"name": "Profit", "data": [20, 30, 15], "color": "#4ecdc4"}]}`,
  inputSchema: barChartSchema
} as const;

export const createLineChartConfig = {
  name: 'createLineChart',
  description: `Create a line chart with simple categories and series.

STRUCTURE:
- categories: Array of x-axis labels (often dates/times)
- series: Array of lines, each with name, data points, and optional color

EXAMPLE:
{"type": "line", "categories": ["Jan", "Feb", "Mar"], "series": [{"name": "Users", "data": [1200, 1400, 1100], "color": "#ff6b6b"}, {"name": "Sessions", "data": [1800, 2100, 1600], "color": "#4ecdc4"}]}`,
  inputSchema: lineChartSchema
} as const;

export const createStackedBarChartConfig = {
  name: 'createStackedBarChart',
  description: `Create a stacked bar chart with categories and stack layers.

STRUCTURE:
- categories: Array of x-axis labels
- series: Array of stack layers, each with name, data values, and optional color

EXAMPLE:
{"type": "stacked-bar", "categories": ["Q1", "Q2", "Q3"], "series": [{"name": "Product A", "data": [50, 60, 45], "color": "#ff6b6b"}, {"name": "Product B", "data": [30, 40, 35], "color": "#4ecdc4"}]}`,
  inputSchema: stackedBarChartSchema
} as const;

export const createPieChartConfig = {
  name: 'createPieChart',
  description: `Create a pie chart with simple segments.

STRUCTURE:
- segments: Array of pie slices, each with label, value, and optional color

EXAMPLE:
{"type": "pie", "segments": [{"label": "Chrome", "value": 65, "color": "#ff6b6b"}, {"label": "Safari", "value": 18, "color": "#4ecdc4"}, {"label": "Firefox", "value": 17}]}`,
  inputSchema: pieChartSchema
} as const;
