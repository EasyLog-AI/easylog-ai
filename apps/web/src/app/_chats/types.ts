import { UIMessage } from 'ai';
import z from 'zod';

import executingToolSchema from './schemas/executingToolSchema';
import mediaImageSchema from './schemas/mediaImageSchema';
import multipleChoiceSchema from './schemas/multipleChoiceSchema';
import researchSchema from './schemas/researchSchema';
import {
  barChartSchema,
  lineChartSchema,
  pieChartSchema,
  stackedBarChartSchema
} from './tools/charts/schemas';

export type ChatMessage = UIMessage<
  unknown,
  {
    'bar-chart': z.infer<typeof barChartSchema>;
    'line-chart': z.infer<typeof lineChartSchema>;
    'stacked-bar-chart': z.infer<typeof stackedBarChartSchema>;
    'pie-chart': z.infer<typeof pieChartSchema>;
    'executing-tool': z.infer<typeof executingToolSchema>;
    'multiple-choice': z.infer<typeof multipleChoiceSchema>;
    'media-image': z.infer<typeof mediaImageSchema>;
    research: z.infer<typeof researchSchema>;
  }
>;
