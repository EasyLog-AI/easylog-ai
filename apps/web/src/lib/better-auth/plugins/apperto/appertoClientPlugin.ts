import { BetterAuthClientPlugin } from 'better-auth';

import appertoServerPlugin from './appertoServerPlugin';

export const magicLinkClient = () => {
  return {
    id: 'apperto-short-lived',
    $InferServerPlugin: {} as ReturnType<typeof appertoServerPlugin>
  } satisfies BetterAuthClientPlugin;
};
