import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { showSubmissionMediaConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolShowSubmissionMedia = (userId: string) => {
  return tool({
    ...showSubmissionMediaConfig,
    execute: async ({ mediaId, size = 'detail' }) => {
      const client = await getEasylogClient(userId);

      const [media, apiError] = await tryCatch(
        client.media.showMedia({
          media: String(mediaId),
          conversion: size === 'original' ? undefined : size
        })
      );

      if (apiError) {
        Sentry.captureException(apiError);
        return `Error fetching media: ${apiError.message}`;
      }

      if (!media) {
        return `Media ${mediaId} not found`;
      }

      console.log('[showSubmissionMedia] Retrieved media:', {
        id: media.id,
        name: media.name,
        mimeType: media.mimeType,
        size: media.size,
        hasConversions: Object.keys(media.conversions || {}).length
      });

      // Determine which URL to use based on requested size
      const conversions = media.conversions ?? {};
      const conversionEntries = Object.entries(conversions).filter(
        ([, value]) => Boolean(value)
      );
      let imageUrl = media.url;

      if (
        size !== 'original' &&
        size &&
        (conversions as Record<string, string | undefined>)[size]
      ) {
        imageUrl = (conversions as Record<string, string | undefined>)[size];
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
        id: media.id,
        uuid: media.uuid,
        name: media.name,
        fileName: media.fileName,
        mimeType: media.mimeType,
        size: formatBytes(media.size || 0),
        url: imageUrl,
        availableSizes: conversionEntries.map(([key]) => key),
        expiresAt: media.expiresAt
      };

      return JSON.stringify(result, null, 2);
    }
  });
};

export default toolShowSubmissionMedia;
