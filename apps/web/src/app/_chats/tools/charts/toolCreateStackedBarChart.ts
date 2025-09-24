import { UIMessageStreamWriter, tool } from 'ai';

import { createStackedBarChartConfig } from './config';

const toolCreateStackedBarChart = (
  messageStreamWriter: UIMessageStreamWriter
) => {
  return tool({
    ...createStackedBarChartConfig,
    execute: async (config, opts) => {
      messageStreamWriter.write({
        type: 'data-stacked-bar-chart',
        id: opts.toolCallId,
        data: config
      });

      return 'Stacked bar chart created successfully';
    }
  });
};

export default toolCreateStackedBarChart;
