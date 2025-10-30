import { UIMessageStreamWriter, tool } from 'ai';

import { createLineChartConfig } from './config';

const toolCreateLineChart = (messageStreamWriter: UIMessageStreamWriter) => {
  return tool({
    ...createLineChartConfig,
    execute: async (config, opts) => {
      messageStreamWriter.write({
        type: 'data-line-chart',
        id: opts.toolCallId,
        data: config
      });

      return 'Line chart created successfully';
    }
  });
};

export default toolCreateLineChart;
