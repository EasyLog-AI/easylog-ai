import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';

import tryCatch from '@/utils/try-catch';

import { showSubmissionMediaConfig } from './config';
import getEasylogClient from './utils/getEasylogClient';

const toolShowSubmissionMedia = (
  userId: string,
  messageStreamWriter: UIMessageStreamWriter
) => {
  return tool({
    ...showSubmissionMediaConfig,
    execute: async ({ mediaId, size = 'detail' }, opts) => {
      const client = await getEasylogClient(userId);

      const [response, apiError] = await tryCatch(
        client.media.showMedia({
          media: String(mediaId),
          conversion: size === 'original' ? undefined : size
        })
      );

      if (apiError) {
        Sentry.captureException(apiError);
        console.error('❌ Media API error:', apiError);
        return `Error fetching media: ${apiError.message}`;
      }

      if (!response || !response.data) {
        console.error('❌ Media not found:', mediaId);
        return `Media ${mediaId} not found`;
      }

      const media = response.data;

      console.log('✅ Media fetched successfully:', {
        id: media.id,
        uuid: media.uuid,
        fileName: media.fileName,
        url: media.url,
        urlLength: media.url?.length || 0,
        conversions: Object.keys(media.conversions || {})
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

      // Helper function to format bytes
      const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (
          Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
        );
      };

      const mediaData = {
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

      // Stream the image data to UI for rendering
      messageStreamWriter.write({
        type: 'data-media-image',
        id: opts.toolCallId,
        data: mediaData
      });

      return `Image displayed: ${media.fileName} (${formatBytes(media.size || 0)})`;
    }
  });
};

export default toolShowSubmissionMedia;
