import type { BetterAuthPlugin } from 'better-auth';
import { APIError, createAuthEndpoint } from 'better-auth/api';
import { setSessionCookie } from 'better-auth/cookies';
import { z } from 'zod';

export interface AppertoUserInfo {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

export interface AppertoPluginOptions {
  /**
   * Base URL for the Apperto API
   *
   * @default 'https://staging2.easylog.nu'
   */
  baseUrl?: string;

  /**
   * Whether to automatically create users if they don't exist
   *
   * @default true
   */
  autoCreateUser?: boolean;

  /**
   * Custom redirect URI.
   * If not provided, a default URI will be constructed.
   */
  redirectURI?: string;
}

const defaultOptions: Omit<Required<AppertoPluginOptions>, 'redirectURI'> = {
  baseUrl: 'https://staging2.easylog.nu',
  autoCreateUser: true
};

const appertoServerPlugin = (
  options: AppertoPluginOptions = {}
): BetterAuthPlugin => {
  const config = { ...defaultOptions, ...options };

  return {
    id: 'apperto-short-lived',
    endpoints: {
      signInAppertoShortLived: createAuthEndpoint(
        '/sign-in/apperto-short-lived',
        {
          method: 'GET',
          query: z.object({
            token: z.string().min(1),
            redirectURI: z.string().optional()
          })
        },
        async (ctx) => {
          const { token, redirectURI } = ctx.query;

          try {
            // Call Apperto userinfo endpoint using the token from query params
            const response = await fetch(`${config.baseUrl}/api/userinfo`, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (!response.ok) {
              throw new APIError('UNAUTHORIZED', {
                message: 'Failed to verify token with Apperto'
              });
            }

            const userInfo: AppertoUserInfo = await response.json();

            if (!userInfo.id || !userInfo.email) {
              throw new APIError('BAD_REQUEST', {
                message: 'Invalid user info from Apperto'
              });
            }

            // Check if user exists
            let user = await ctx.context.internalAdapter.findUserByEmail(
              userInfo.email
            );

            if (!user && !config.autoCreateUser) {
              throw new APIError('NOT_FOUND', {
                message: 'User not found and auto-creation is disabled'
              });
            }

            // Create new user
            user = await ctx.context.internalAdapter.createUser({
              email: userInfo.email,
              emailVerified: true,
              name: userInfo.name || userInfo.email.split('@')[0],
              image: userInfo.picture || null
            });

            if (!user) {
              throw new APIError('NOT_FOUND', {
                message: 'User not found or not created'
              });
            }

            // Create session
            const session = await ctx.context.internalAdapter.createSession(
              user.user.id,
              ctx
            );

            // Set session cookie
            await setSessionCookie(ctx, {
              session,
              user: user.user
            });

            // Handle redirect
            const finalRedirectURI = redirectURI || config.redirectURI;
            if (finalRedirectURI) {
              return ctx.redirect(finalRedirectURI);
            }

            return ctx.json({
              user: user.user,
              session
            });
          } catch (error) {
            if (error instanceof APIError) {
              throw error;
            }

            throw new APIError('INTERNAL_SERVER_ERROR', {
              message: 'Failed to process Apperto token'
            });
          }
        }
      )
    }
  };
};

export default appertoServerPlugin;
