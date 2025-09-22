import { UIMessageStreamWriter, tool } from 'ai';

import { createChartConfig } from './config';

const toolCreateChart = (messageStreamWriter: UIMessageStreamWriter) => {
  return tool({
    ...createChartConfig,
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
