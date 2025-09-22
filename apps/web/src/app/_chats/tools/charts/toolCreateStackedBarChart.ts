import { UIMessageStreamWriter, tool } from 'ai';

import { createStackedBarChartConfig } from './config';

const toolCreateStackedBarChart = (
  messageStreamWriter: UIMessageStreamWriter
) => {
  return tool({
    ...createStackedBarChartConfig,
    execute: async (config, opts) => {
      // Transform simplified format to internal format
      const availableColors = [
        'var(--color-chart-1)',
        'var(--color-chart-2)',
        'var(--color-chart-3)',
        'var(--color-chart-4)',
        'var(--color-chart-5)'
      ];

      // Create data objects: each category becomes an object with series values
      const transformedData = config.categories.map(
        (category, categoryIndex) => {
          const dataObj: Record<string, string | number> = { category };
          config.series.forEach((series, seriesIndex) => {
            dataObj[`series_${seriesIndex}`] = series.data[categoryIndex] || 0;
          });
          return dataObj;
        }
      );

      // Create values array: each series becomes a value entry
      const values = config.series.map((series, index) => ({
        dataKey: `series_${index}`,
        label: series.name,
        color: series.color ?? availableColors[index % availableColors.length]
      }));

      const internalConfig = {
        type: 'stacked-bar' as const,
        data: transformedData,
        xAxisKey: 'category',
        values
      };

      messageStreamWriter.write({
        type: 'data-stacked-bar-chart',
        id: opts.toolCallId,
        data: internalConfig
      });

      return 'Stacked bar chart created successfully';
    }
  });
};

export default toolCreateStackedBarChart;
