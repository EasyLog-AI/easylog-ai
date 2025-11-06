import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { genericOAuth } from 'better-auth/plugins';

import db from '@/database/client';
import * as schema from '@/database/schema';
import serverConfig from '@/server.config';

import appertoServerPlugin from './plugins/apperto/appertoServerPlugin';
import externalJWTPlugin from './plugins/externalJWT/externalJWTPlugin';

const authServerClient = betterAuth({
  baseURL: serverConfig.appUrl.toString(),
  secret: serverConfig.betterAuthSecret,
  emailAndPassword: {
    enabled: true
  },
  trustedOrigins: [
    serverConfig.appUrl.toString(),
    'https://apperto-ai.byont.io',
    serverConfig.env === 'development' ? 'http://localhost:3000' : ''
  ].filter(Boolean),
  plugins: [
    nextCookies(),
    appertoServerPlugin({
      baseUrl: 'https://staging2.easylog.nu',
      autoCreateUser: true
    }),
    genericOAuth({
      config: [
        {
          providerId: 'easylog',
          clientId: '99a0db85-5cd0-4f60-b65e-03483b72d14a',
          discoveryUrl:
            'https://staging2.easylog.nu/.well-known/openid-configuration',
          scopes: ['openid'],
          pkce: true,
          clientSecret: ''
        }
      ]
    }),
    externalJWTPlugin({
      discoveryUrl:
        'https://staging2.easylog.nu/.well-known/openid-configuration',
      claimVerificationOptions: {
        audience: '99a0db85-5cd0-4f60-b65e-03483b72d14a',
        requiredClaims: ['sub']
      }
    })
  ],
  advanced: {
    database: {
      generateId: () => crypto.randomUUID()
    }
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
    schema
  })
});

export default authServerClient;
