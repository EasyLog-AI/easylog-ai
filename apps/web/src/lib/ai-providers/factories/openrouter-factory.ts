import { createOpenRouter } from '@openrouter/ai-sdk-provider';

import serverConfig from '@/server.config';

type TransformsConfig = {
  enabled: boolean;
  transforms?: string[];
};

const createOpenRouterProvider = (transformsConfig?: TransformsConfig) => {
  const defaultTransforms = ['middle-out'];
  const transforms =
    transformsConfig?.enabled !== false
      ? (transformsConfig?.transforms ?? defaultTransforms)
      : undefined;

  return createOpenRouter({
    apiKey: serverConfig.openrouterApiKey,
    ...(transforms && {
      extraBody: {
        transforms
      }
    })
  });
};

export default createOpenRouterProvider;
