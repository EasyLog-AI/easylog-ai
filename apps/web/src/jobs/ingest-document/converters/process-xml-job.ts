import { logger, schemaTask } from '@trigger.dev/sdk';
import { z } from 'zod';

import processXmlData from './process-xml/process-xml-data';

export const processXmlJob = schemaTask({
  id: 'process-xml',
  schema: z.object({
    downloadUrl: z.string()
  }),
  machine: 'small-2x',
  retry: {
    outOfMemory: {
      machine: 'large-1x'
    }
  },
  run: async ({ downloadUrl }) => {
    logger.info('Document URL', { downloadUrl });

    const response = await fetch(downloadUrl);
    const xmlText = await response.text();

    logger.info('XML text length', { length: xmlText.length });
    logger.info('XML text sample', { sample: xmlText.substring(0, 500) });

    const result = processXmlData(xmlText);

    logger.info('Processed XML data', {
      recordCount: result.data.length,
      sampleRecord: result.data[0],
      allFields: result.columns
    });

    return [result];
  }
});
