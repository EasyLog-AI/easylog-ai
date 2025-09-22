import { UIMessageStreamWriter, tool } from 'ai';

import { createLineChartConfig } from './config';

const toolCreateLineChart = (messageStreamWriter: UIMessageStreamWriter) => {
  return tool({
    ...createLineChartConfig,
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
        type: 'line' as const,
        data: transformedData,
        xAxisKey: 'category',
        values
      };

      messageStreamWriter.write({
        type: 'data-line-chart',
        id: opts.toolCallId,
        data: internalConfig
      });

      return 'Line chart created successfully';
    }
  });
};

export default toolCreateLineChart;
