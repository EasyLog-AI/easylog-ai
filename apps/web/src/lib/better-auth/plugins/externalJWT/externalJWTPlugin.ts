/**
 * External JWT Authentication Plugin for Better Auth
 *
 * This plugin enables authentication via external JWT bearer tokens from
 * third-party identity providers (Auth0, Cognito, Keycloak, etc.). It validates
 * JWT signatures against JWKS endpoints and automatically creates Better Auth
 * sessions.
 *
 * @module externalJWT
 *
 * @example
 *   ```typescript
 *   import { betterAuth } from 'better-auth';
 *   import { externalJWT } from './plugins/externalJWT';
 *
 *   export const auth = betterAuth({
 *     plugins: [
 *       externalJWT({
 *         discoveryUrl: 'https://auth.example.com/.well-known/openid-configuration',
 *         audience: 'my-api-identifier'
 *       })
 *     ]
 *   });
 *
 *   // Client usage:
 *   // curl -H "Authorization: Bearer <jwt-token>" https://api.example.com/protected
 *   ```;
 *
 * @security
 * - Cryptographically validates JWT signatures using JWKS
 * - Verifies token expiration and standard claims
 * - Optional audience (aud) claim validation
 * - Supports both OIDC discovery and direct JWKS configuration
 * - JWKS caching for performance (automatic key rotation support)
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7519 - JWT specification
 * @see https://openid.net/specs/openid-connect-discovery-1_0.html - OIDC Discovery
 */

import { APIError } from 'better-auth/api';
import { BetterAuthPlugin, createAuthMiddleware } from 'better-auth/plugins';
import {
  JWTClaimVerificationOptions,
  createRemoteJWKSet,
  jwtVerify
} from 'jose';

import db from '@/database/client';
import tryCatch from '@/utils/try-catch';

import openIDDiscoverySchema from './schemas/openIDDiscoverySchema';

/**
 * Error codes that can be returned by the external JWT plugin
 *
 * @remarks
 *   All errors follow OAuth2/OIDC error response patterns for consistency
 */
export type ExternalJWTErrorCode =
  | 'DISCOVERY_FAILED' // Failed to fetch OpenID discovery document
  | 'INVALID_DISCOVERY_DOCUMENT' // Discovery document has invalid JSON format
  | 'INVALID_DISCOVERY_SCHEMA' // Discovery document failed schema validation
  | 'INVALID_TOKEN' // JWT validation failed (signature, expiration, etc.)
  | 'MISSING_SUB_CLAIM' // JWT missing required 'sub' claim
  | 'USERINFO_FETCH_FAILED' // Failed to fetch user info from userinfo endpoint
  | 'INVALID_USERINFO_RESPONSE' // Userinfo endpoint returned invalid JSON
  | 'USER_NOT_FOUND' // User not found and userinfo endpoint not configured
  | 'TOKEN_PROCESSING_FAILED'; // Generic error during token processing

/** Configuration options for the external JWT authentication plugin */
export type ExternalJWTPluginOptions = {
  /**
   * JWT audience to validate against (optional) If provided, the JWT's 'aud'
   * claim must match this value
   */
  claimVerificationOptions?: JWTClaimVerificationOptions;
} & (
  | {
      /**
       * OpenID Connect discovery URL The plugin will fetch JWKS URI and
       * userinfo endpoint from this URL
       *
       * @example
       *   'https://accounts.google.com/.well-known/openid-configuration';
       */
      discoveryUrl: string | URL;
    }
  | {
      /**
       * Direct JWKS URI for JWT validation
       *
       * @example
       *   'https://auth.example.com/.well-known/jwks.json';
       */
      jwksUri: string | URL;
      /**
       * Optional userinfo endpoint for automatic user creation If user doesn't
       * exist, plugin will fetch user data from this endpoint
       *
       * @example
       *   'https://auth.example.com/userinfo';
       */
      userinfoEndpoint?: string | URL;
    }
);

/**
 * External JWT authentication plugin for Better Auth
 *
 * Validates JWT bearer tokens from external identity providers and creates
 * Better Auth sessions. Supports both OpenID Connect discovery and direct JWKS
 * configuration.
 *
 * @example
 *   ```ts
 *   // Using OpenID Connect discovery
 *   externalJWT({
 *     discoveryUrl: 'https://auth.example.com/.well-known/openid-configuration',
 *     audience: 'my-api'
 *   })
 *
 *   // Using direct JWKS URI
 *   externalJWT({
 *     jwksUri: 'https://auth.example.com/.well-known/jwks.json',
 *     userinfoEndpoint: 'https://auth.example.com/userinfo'
 *   })
 *   ```;
 *
 * @param options - Configuration options
 * @returns A Better Auth plugin
 */
const externalJWTPlugin = (options: ExternalJWTPluginOptions) => {
  /**
   * Cache for JWKS configuration (resolved once at startup)
   * This prevents repeated discovery document fetches and JWKS creation
   * 
   * Note: Cache persists for the lifetime of the server process. If the IdP
   * changes their JWKS URI or userinfo endpoint, a redeploy is required.
   */
  let cachedUserinfoEndpoint: string | URL | undefined = undefined;
  let cachedJwksSet: ReturnType<typeof createRemoteJWKSet> | null = null;
  let cacheInitialized = false;

  return {
    id: 'external-jwt',
    hooks: {
      before: [
        {
          matcher(context) {
            const authHeader =
              context.request?.headers.get('authorization') ||
              context.headers?.get('authorization');

            if (!authHeader) {
              return false;
            }

            /** Extract bearer token */
            const token = authHeader.replace(/^Bearer /i, '');

            /**
             * JWT format validation: must have exactly 3 parts separated by
             * dots Format: header.payload.signature
             */
            const parts = token.split('.');
            if (parts.length !== 3) {
              return false;
            }

            /**
             * Basic validation: each part should be base64url encoded
             * (non-empty) We don't decode here, just check format to avoid
             * processing non-JWT tokens
             */
            return parts.every(
              (part) => part.length > 0 && /^[A-Za-z0-9_-]+$/.test(part)
            );
          },
          /**
           * Middleware that validates external JWT bearer tokens and creates
           * sessions
           *
           * Flow:
           *
           * 1. Extracts bearer token from Authorization header
           * 2. Validates JWT against JWKS (with caching)
           * 3. Verifies audience claim if configured
           * 4. Finds or creates user based on 'sub' claim
           * 5. Creates Better Auth session and sets cookie
           *
           * @throws {APIError} UNAUTHORIZED - Invalid or expired token
           * @throws {APIError} BAD_REQUEST - Missing required claims or invalid
           *   format
           * @throws {APIError} NOT_FOUND - User not found and userinfo endpoint
           *   not configured
           */
          handler: createAuthMiddleware(async (c) => {
            console.log('[externalJWT] Handler triggered');

            const token =
              c.request?.headers.get('authorization')?.replace('Bearer ', '') ||
              c.headers?.get('Authorization')?.replace('Bearer ', '');

            if (!token) {
              console.log('[externalJWT] No bearer token found');
              return;
            }

            console.log(
              '[externalJWT] Token found:',
              token.substring(0, 50) + '...'
            );

            /** Step 1: Resolve JWKS URI and userinfo endpoint from configuration */
            console.log('[externalJWT] Step 1: Resolving JWKS URI...');

            /**
             * Use cached JWKS configuration if available
             * This prevents repeated discovery document fetches on every request
             */
            if (!cacheInitialized) {
              console.log('[externalJWT] Initializing JWKS cache...');
              let jwksUri: string | URL;
              let userinfoEndpoint: string | URL | undefined;

              if ('jwksUri' in options) {
                /** Direct JWKS configuration */
                console.log('[externalJWT] Using direct JWKS URI');
                jwksUri = options.jwksUri;
                userinfoEndpoint = options.userinfoEndpoint;
              } else {
                /** OpenID Connect discovery flow */
                console.log(
                  '[externalJWT] Fetching discovery document from:',
                  options.discoveryUrl
                );
                const [discoveryResponse, discoveryError] = await tryCatch(
                  fetch(options.discoveryUrl)
                );

                if (discoveryError || !discoveryResponse.ok) {
                  console.error(
                    '[externalJWT] Discovery fetch failed:',
                    discoveryError
                  );
                  throw new APIError('BAD_REQUEST', {
                    message: 'Failed to fetch OpenID discovery document',
                    code: 'DISCOVERY_FAILED'
                  });
                }

                console.log(
                  '[externalJWT] Discovery document fetched successfully'
                );

                const [discoveryJson, jsonError] = await tryCatch(
                  discoveryResponse.json()
                );

                if (jsonError) {
                  console.error(
                    '[externalJWT] Failed to parse discovery JSON:',
                    jsonError
                  );
                  throw new APIError('BAD_REQUEST', {
                    message: 'Invalid OpenID discovery document format',
                    code: 'INVALID_DISCOVERY_DOCUMENT'
                  });
                }

                const parseResult =
                  openIDDiscoverySchema.safeParse(discoveryJson);

                if (!parseResult.success) {
                  console.error(
                    '[externalJWT] Discovery schema validation failed:',
                    parseResult.error
                  );
                  throw new APIError('BAD_REQUEST', {
                    message: 'OpenID discovery document validation failed',
                    code: 'INVALID_DISCOVERY_SCHEMA'
                  });
                }

                jwksUri = parseResult.data.jwks_uri;
                userinfoEndpoint = parseResult.data.userinfo_endpoint;
                console.log('[externalJWT] JWKS URI:', jwksUri);
                console.log('[externalJWT] Userinfo endpoint:', userinfoEndpoint);
              }

              /** Cache the configuration and create JWKS set once */
              cachedUserinfoEndpoint = userinfoEndpoint;
              cachedJwksSet = createRemoteJWKSet(new URL(jwksUri), {
                cacheMaxAge: 600_000, // Cache JWKS for 10 minutes
                cooldownDuration: 30_000 // Wait 30s between refetches
              });
              cacheInitialized = true;
              console.log('[externalJWT] JWKS cache initialized successfully');
            } else {
              console.log('[externalJWT] Using cached JWKS configuration');
            }

            const jwksCache = cachedJwksSet!;
            const userinfoEndpoint = cachedUserinfoEndpoint;

            /**
             * Step 2: Validate JWT token against JWKS (with caching for
             * performance)
             */
            console.log('[externalJWT] Step 2: Validating JWT...');

            console.log('[externalJWT] Verifying JWT signature...');
            console.log(
              '[externalJWT] Verification options:',
              JSON.stringify(options.claimVerificationOptions, null, 2)
            );
            const [verifyResult, verifyError] = await tryCatch(
              jwtVerify(token, jwksCache, options.claimVerificationOptions)
            );

            if (verifyError) {
              console.error('[externalJWT] JWT verification failed!');
              console.error('[externalJWT] Error name:', verifyError.name);
              console.error(
                '[externalJWT] Error message:',
                verifyError.message
              );
              console.error('[externalJWT] Error stack:', verifyError.stack);
              throw new APIError('UNAUTHORIZED', {
                message: `JWT token validation failed: ${verifyError.message}`,
                code: 'INVALID_TOKEN'
              });
            }

            console.log('[externalJWT] JWT verified successfully');

            const { payload } = verifyResult;

            /** Step 3: Extract and validate required claims */
            console.log('[externalJWT] Step 3: Extracting claims...');
            const sub = payload.sub;
            console.log('[externalJWT] Subject (sub):', sub);

            if (!sub) {
              console.error('[externalJWT] Missing sub claim in JWT');
              throw new APIError('BAD_REQUEST', {
                message: 'JWT token missing required sub claim',
                code: 'MISSING_SUB_CLAIM'
              });
            }

            const accounts = await db.query.accounts.findMany({
              where: {
                accountId: sub
              },
              with: {
                user: true
              }
            });

            let user = accounts.length > 0 ? accounts[0].user : null;

            if (user) {
              console.log('[externalJWT] User found:', user.email);
            } else {
              console.log('[externalJWT] User not found in database');
            }

            /** Step 5: Fetch user info from userinfo endpoint if user not found */
            if (!user && userinfoEndpoint) {
              console.log(
                '[externalJWT] Step 5: Fetching user info from:',
                userinfoEndpoint
              );
              const [userinfoResponse, userinfoError] = await tryCatch(
                fetch(userinfoEndpoint, {
                  headers: {
                    Authorization: `Bearer ${token}`
                  }
                })
              );

              if (userinfoError || !userinfoResponse.ok) {
                throw new APIError('UNAUTHORIZED', {
                  message: 'Failed to fetch user info from userinfo endpoint',
                  code: 'USERINFO_FETCH_FAILED'
                });
              }

              const [userinfoData, userinfoJsonError] = await tryCatch(
                userinfoResponse.json()
              );

              if (userinfoJsonError) {
                throw new APIError('BAD_REQUEST', {
                  message: 'Invalid user info response format',
                  code: 'INVALID_USERINFO_RESPONSE'
                });
              }

              /** Automatically create user with data from userinfo endpoint */
              user = await c.context.internalAdapter.createUser({
                email: userinfoData.email,
                emailVerified: true,
                name: userinfoData.name || userinfoData.preferred_username
              });
            }

            if (!user) {
              throw new APIError('NOT_FOUND', {
                message: 'User not found and userinfo endpoint not configured',
                code: 'USER_NOT_FOUND'
              });
            }

            /** Create external-jwt account for authentication */
            if (
              !accounts.some((account) => account.providerId === 'external-jwt')
            ) {
              await c.context.internalAdapter.createAccount({
                userId: user.id,
                accountId: sub,
                providerId: 'external-jwt'
              });
            }

            /**
             * Create or update easylog provider account for tool access
             * This allows tools to use getAccessToken() to access staging2 API
             * The JWT token is stored as accessToken for API calls
             * We update the token on every request to keep it fresh
             */
            const easylogAccount = accounts.find(
              (account) => account.providerId === 'easylog'
            );

            if (!easylogAccount) {
              console.log(
                '[externalJWT] Creating easylog provider account for tool access'
              );
              await c.context.internalAdapter.createAccount({
                userId: user.id,
                accountId: sub,
                providerId: 'easylog',
                accessToken: token,
                accessTokenExpiresAt: payload.exp
                  ? new Date(payload.exp * 1000)
                  : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              });
            } else {
              /**
               * Update the access token on every request
               * This ensures tools always have a valid token for staging2 API
               */
              console.log(
                '[externalJWT] Updating easylog provider account token'
              );
              await c.context.internalAdapter.updateAccount(easylogAccount.id, {
                accessToken: token,
                accessTokenExpiresAt: payload.exp
                  ? new Date(payload.exp * 1000)
                  : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              });
            }

            /**
             * Step 6: Find or create session based on JWT token Try to find
             * existing session by token
             */
            const existingSession =
              await c.context.internalAdapter.findSession(token);

            const session = existingSession
              ? existingSession.session
              : {
                  id: payload.jti ?? token,
                  token,
                  userId: user.id,
                  userAgent: c.request?.headers.get('user-agent') ?? null,
                  ipAddress: c.request?.headers.get('x-forwarded-for') ?? null,
                  createdAt: payload.iat
                    ? new Date(payload.iat * 1000)
                    : new Date(),
                  updatedAt: new Date(),
                  expiresAt: payload.exp
                    ? new Date(payload.exp * 1000)
                    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                };

            /** Step 7: Set session context and cookie */
            c.context.session = {
              user,
              session
            };

            return {
              user,
              session
            };
          })
        }
      ]
    }
  } satisfies BetterAuthPlugin;
};

export default externalJWTPlugin;
