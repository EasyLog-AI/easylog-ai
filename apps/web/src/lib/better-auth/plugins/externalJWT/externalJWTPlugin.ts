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
import { setSessionCookie } from 'better-auth/cookies';
import { BetterAuthPlugin, createAuthMiddleware } from 'better-auth/plugins';
import {
  JWTClaimVerificationOptions,
  createRemoteJWKSet,
  jwtVerify
} from 'jose';

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
  /** In-memory cache for JWKS (jose library handles key rotation internally) */
  let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;
  let jwksUriCache: string | null = null;

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
            const token =
              c.request?.headers.get('authorization')?.replace('Bearer ', '') ||
              c.headers?.get('Authorization')?.replace('Bearer ', '');

            if (!token) {
              return;
            }

            try {
              /**
               * Step 1: Resolve JWKS URI and userinfo endpoint from
               * configuration
               */
              let jwksUri: string | URL;
              let userinfoEndpoint: string | URL | undefined;

              if ('jwksUri' in options) {
                /** Direct JWKS configuration */
                jwksUri = options.jwksUri;
                userinfoEndpoint = options.userinfoEndpoint;
              } else {
                /** OpenID Connect discovery flow */
                const [discoveryResponse, discoveryError] = await tryCatch(
                  fetch(options.discoveryUrl)
                );

                if (discoveryError || !discoveryResponse.ok) {
                  throw new APIError('BAD_REQUEST', {
                    message: 'Failed to fetch OpenID discovery document',
                    code: 'DISCOVERY_FAILED'
                  });
                }

                const [discoveryJson, jsonError] = await tryCatch(
                  discoveryResponse.json()
                );

                if (jsonError) {
                  throw new APIError('BAD_REQUEST', {
                    message: 'Invalid OpenID discovery document format',
                    code: 'INVALID_DISCOVERY_DOCUMENT'
                  });
                }

                const parseResult =
                  openIDDiscoverySchema.safeParse(discoveryJson);

                if (!parseResult.success) {
                  throw new APIError('BAD_REQUEST', {
                    message: 'OpenID discovery document validation failed',
                    code: 'INVALID_DISCOVERY_SCHEMA'
                  });
                }

                jwksUri = parseResult.data.jwks_uri;
                userinfoEndpoint = parseResult.data.userinfo_endpoint;
              }

              /**
               * Step 2: Validate JWT token against JWKS (with caching for
               * performance)
               */
              const jwksUriString = jwksUri.toString();
              if (!jwksCache || jwksUriCache !== jwksUriString) {
                jwksCache = createRemoteJWKSet(new URL(jwksUri));
                jwksUriCache = jwksUriString;
              }

              const [verifyResult, verifyError] = await tryCatch(
                jwtVerify(token, jwksCache, options.claimVerificationOptions)
              );

              if (verifyError) {
                throw new APIError('UNAUTHORIZED', {
                  message: 'JWT token validation failed',
                  code: 'INVALID_TOKEN'
                });
              }

              const { payload } = verifyResult;

              /** Step 3: Extract and validate required claims */
              const sub = payload.sub;

              if (!sub) {
                throw new APIError('BAD_REQUEST', {
                  message: 'JWT token missing required sub claim',
                  code: 'MISSING_SUB_CLAIM'
                });
              }

              /** Step 4: Find or create user based on sub claim */
              let user = await c.context.internalAdapter.findUserById(sub);

              /**
               * Step 5: Fetch user info from userinfo endpoint if user not
               * found
               */
              if (!user && userinfoEndpoint) {
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
                  id: sub,
                  email: userinfoData.email,
                  emailVerified: true,
                  name: userinfoData.name || userinfoData.preferred_username
                });
              }

              if (!user) {
                throw new APIError('NOT_FOUND', {
                  message:
                    'User not found and userinfo endpoint not configured',
                  code: 'USER_NOT_FOUND'
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
                    ipAddress:
                      c.request?.headers.get('x-forwarded-for') ?? null,
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

              await setSessionCookie(c, {
                session,
                user
              });
            } catch (error) {
              if (error instanceof APIError) {
                throw error;
              }

              throw new APIError('INTERNAL_SERVER_ERROR', {
                message: 'Failed to process bearer token',
                code: 'TOKEN_PROCESSING_FAILED'
              });
            }
          })
        }
      ]
    }
  } satisfies BetterAuthPlugin;
};

export default externalJWTPlugin;
