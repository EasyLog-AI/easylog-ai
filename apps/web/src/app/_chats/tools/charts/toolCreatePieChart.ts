import { UIMessageStreamWriter, tool } from 'ai';

import { createPieChartConfig } from './config';

const toolCreatePieChart = (messageStreamWriter: UIMessageStreamWriter) => {
  return tool({
    ...createPieChartConfig,
    execute: async (config, opts) => {
      messageStreamWriter.write({
        type: 'data-pie-chart',
        id: opts.toolCallId,
        data: config
      });

      return 'Pie chart created successfully';
    }
  });
};

export default toolCreatePieChart;
