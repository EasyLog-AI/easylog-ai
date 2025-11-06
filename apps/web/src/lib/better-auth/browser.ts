import { passkeyClient } from 'better-auth/client/plugins';
import { genericOAuthClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

const authBrowserClient = createAuthClient({
  plugins: [passkeyClient(), genericOAuthClient()]
});

export default authBrowserClient;
