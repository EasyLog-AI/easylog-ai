import { UIMessageStreamWriter, tool } from 'ai';

import { createBarChartConfig } from './config';

const toolCreateBarChart = (messageStreamWriter: UIMessageStreamWriter) => {
  return tool({
    ...createBarChartConfig,
    execute: async (config, opts) => {
      messageStreamWriter.write({
        type: 'data-bar-chart',
        id: opts.toolCallId,
        data: config
      });

      return 'Bar chart created successfully';
    }
  });
};

export default toolCreateBarChart;
