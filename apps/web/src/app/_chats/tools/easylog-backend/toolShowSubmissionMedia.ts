import { UIMessageStreamWriter, tool } from 'ai';
import * as Sentry from '@sentry/nextjs';

import tryCatch from '@/utils/try-catch';

import { showSubmissionMediaConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolShowSubmissionMedia = (
  userId: string,
  messageStreamWriter: UIMessageStreamWriter
) => {
  return tool({
    ...showSubmissionMediaConfig,
    execute: async ({ mediaId, size = 'detail' }) => {
      const client = await getEasylogClient(userId);

      const [media, error] = await tryCatch(
        client.media.showMedia({
          media: String(mediaId),
          conversion: size === 'original' ? undefined : size
        })
      );

      if (error) {
        Sentry.captureException(error);
        return `Error fetching media: ${error.message}`;
      }

      if (!media?.data) {
        return `Media ${mediaId} not found`;
      }

      const mediaData = media.data;
      console.log('[showSubmissionMedia] Retrieved media:', {
        id: mediaData.id,
        name: mediaData.name,
        mimeType: mediaData.mimeType,
        size: mediaData.size,
        hasConversions: Object.keys(mediaData.conversions || {}).length
      });

      // Determine which URL to use based on requested size
      let imageUrl = mediaData.url;

      if (size !== 'original' && mediaData.conversions?.[size]) {
        imageUrl = mediaData.conversions[size];
        console.log(`[showSubmissionMedia] Using ${size} conversion`);
      } else {
        console.log('[showSubmissionMedia] Using original URL');
      }

      // Return media details with public URL for agent to use
      const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
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
