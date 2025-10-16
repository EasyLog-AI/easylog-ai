import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';

import serverConfig from '@/server.config';

const createAmazonBedrockProvider = () => {
  return createAmazonBedrock({
    region: serverConfig.awsRegion,
    apiKey: serverConfig.awsAPIKey
  });
};

export default createAmazonBedrockProvider;
