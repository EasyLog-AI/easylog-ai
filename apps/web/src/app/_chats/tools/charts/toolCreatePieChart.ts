import { UIMessageStreamWriter, tool } from 'ai';

import { createPieChartConfig } from './config';

const toolCreatePieChart = (messageStreamWriter: UIMessageStreamWriter) => {
  return tool({
    ...createPieChartConfig,
    execute: async (config, opts) => {
      // Transform simplified segments to internal format
      const availableColors = [
        'var(--color-chart-1)',
        'var(--color-chart-2)',
        'var(--color-chart-3)',
        'var(--color-chart-4)',
        'var(--color-chart-5)'
      ];

      const transformedData = config.segments.map((segment) => ({
        label: segment.label,
        value: segment.value
      }));

      // Create a value entry for each segment to enable individual colors
      const values = config.segments.map((segment, index) => ({
        dataKey: 'value', // All use the same dataKey
        label: segment.label,
        color: segment.color ?? availableColors[index % availableColors.length]
      }));

      const internalConfig = {
        type: 'pie' as const,
        data: transformedData,
        xAxisKey: 'label',
        values
      };

      messageStreamWriter.write({
        type: 'data-pie-chart',
        id: opts.toolCallId,
        data: internalConfig
      });

      return 'Pie chart created successfully';
    }
  });
};

export default toolCreatePieChart;
