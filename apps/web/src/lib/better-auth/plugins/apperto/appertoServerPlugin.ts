import * as Sentry from '@sentry/nextjs';
import type { BetterAuthPlugin } from 'better-auth';
import { APIError, createAuthEndpoint } from 'better-auth/api';
import { setSessionCookie } from 'better-auth/cookies';
import { z } from 'zod';

import tryCatch from '@/utils/try-catch';

const appertoUserInfoSchema = z.object({
  sub: z.number(),
  email: z.string().email(),
  name: z.string()
});

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
            redirect_uri: z.string().optional()
          })
        },
        async (ctx) => {
          const { token, redirect_uri: redirectURI } = ctx.query;

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
                message: 'Failed to verify token with Apperto',
                code: 'INVALID_TOKEN'
              });
            }

            const [jsonResponse, jsonResponseError] = await tryCatch(
              response.json()
            );

            if (jsonResponseError) {
              throw new APIError('UNAUTHORIZED', {
                message: 'Invalid response from Apperto',
                code: 'INVALID_TOKEN'
              });
            }

            const userInfoResult =
              appertoUserInfoSchema.safeParse(jsonResponse);

            if (!userInfoResult.success) {
              throw new APIError('BAD_REQUEST', {
                message: 'Invalid user info from Apperto',
                code: 'INVALID_USER_INFO'
              });
            }

            // Check if user exists
            let user = await ctx.context.internalAdapter.findUserByEmail(
              userInfoResult.data.email
            );

            if (!user && !config.autoCreateUser) {
              throw new APIError('NOT_FOUND', {
                message: 'User not found and auto-creation is disabled',
                code: 'USER_NOT_FOUND'
              });
            }

            if (!user) {
              user = await ctx.context.internalAdapter.createUser({
                email: userInfoResult.data.email,
                emailVerified: true,
                name: userInfoResult.data.name
              });
            }

            if (!user) {
              throw new APIError('NOT_FOUND', {
                message: 'User not found or not created',
                code: 'USER_NOT_FOUND'
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

            console.log('redirectURI', redirectURI);

            if (redirectURI) {
              console.log('redirecting to', redirectURI);
              return ctx.redirect(redirectURI);
            }

            return ctx.json({
              user: user.user,
              session
            });
          } catch (error) {
            console.error('Error processing Apperto token', error);
            Sentry.captureException(error);

            if (error instanceof APIError) {
              throw error;
            }

            throw new APIError('INTERNAL_SERVER_ERROR', {
              code: 'FAILED_TO_PROCESS_APPERTO_TOKEN',
              message: 'Failed to process Apperto token'
            });
          }
        }
      )
    }
  };
};

export default appertoServerPlugin;
