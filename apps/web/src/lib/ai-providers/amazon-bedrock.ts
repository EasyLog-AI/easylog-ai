import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';

import serverConfig from '@/server.config';

/** @see https://docs.aws.amazon.com/bedrock/ */
const amazonBedrock = createAmazonBedrock({
  apiKey: serverConfig.awsAPIKey,
  region: serverConfig.awsRegion
});

export default amazonBedrock;
