import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';

import serverConfig from '@/server.config';

const createAmazonBedrockProvider = () => {
  return createAmazonBedrock({
    bedrockOptions: {
      region: serverConfig.awsRegion,
      credentials: {
        accessKeyId: serverConfig.awsAccessKeyId ?? '',
        secretAccessKey: serverConfig.awsSecretAccessKey ?? ''
      }
    }
  });
};

export default createAmazonBedrockProvider;
