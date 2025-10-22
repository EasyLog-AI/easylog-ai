import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import authServerClient from '@/lib/better-auth/server';
import tryCatch from '@/utils/try-catch';

import { showSubmissionMediaConfig } from './config';

const toolShowSubmissionMedia = (userId: string) => {
  return tool({
    ...showSubmissionMediaConfig,
    execute: async ({ mediaId, size = 'detail' }) => {
      // Get access token for API authentication
      const { accessToken } = await authServerClient.api.getAccessToken({
        body: {
          providerId: 'easylog',
          userId
        }
      });

      if (!accessToken) {
        return 'Error: No access token available';
      }

      // Direct API call since MediaApi is not yet generated
      // TODO: Replace with client.media.showMedia() after OpenAPI regeneration
      const baseUrl = 'https://staging2.easylog.nu/api';
      const url = `${baseUrl}/v2/media/${mediaId}${size !== 'original' ? `?conversion=${size}` : ''}`;

      const [response, fetchError] = await tryCatch(
        fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json'
          }
        })
      );

      if (fetchError) {
        Sentry.captureException(fetchError);
        return `Error fetching media: ${fetchError.message}`;
      }

      if (!response || !response.ok) {
        const error = new Error(`HTTP ${response?.status || 'unknown'}`);
        Sentry.captureException(error);
        return `Error fetching media: ${response?.statusText || 'Unknown error'}`;
      }

      const [data, jsonError] = await tryCatch(response.json());

      if (jsonError) {
        Sentry.captureException(jsonError);
        return `Error parsing response: ${jsonError.message}`;
      }

      const mediaData = data.data;

      if (!mediaData) {
        return `Media ${mediaId} not found`;
      }

      // Determine which URL to use based on requested size
      let imageUrl = mediaData.url;

      if (size !== 'original' && mediaData.conversions?.[size]) {
        imageUrl = mediaData.conversions[size];
      }

      // Return media details with public URL for agent to use
      const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (
          Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
        );
      };

      const result = {
        id: mediaData.id,
        uuid: mediaData.uuid,
        name: mediaData.name,
        fileName: mediaData.fileName,
        mimeType: mediaData.mimeType,
        size: formatBytes(mediaData.size || 0),
        url: imageUrl,
        availableSizes: Object.keys(mediaData.conversions || {}),
        expiresAt: mediaData.expiresAt
      };

      return JSON.stringify(result, null, 2);
    }
  });
};

export default toolShowSubmissionMedia;
