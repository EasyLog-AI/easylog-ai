import { UIMessage } from 'ai';

import { RealtimeMessageItem } from '../schemas/realtimeItemSchema';

const createGroupedMessage = (
  items: RealtimeMessageItem[]
): UIMessage | null => {
  if (items.length === 0) return null;

  const parts = items
    .map((item) => {
      // Extract text content from the realtime message
      const textContent = item.content
        .map((content) => {
          if (content.type === 'input_text' || content.type === 'output_text') {
            return content.text;
          }
          if (
            content.type === 'input_audio' ||
            content.type === 'output_audio'
          ) {
            return `[${content.transcript}]` || '';
          }
          return '';
        })
        .filter(Boolean)
        .join(' ');

      console.log('Converting grouped realtime message:', {
        itemId: item.itemId,
        role: item.role,
        status: 'status' in item ? item.status : 'system',
        contentTypes: item.content.map((c) => c.type),
        textContent,
        hasTranscript: item.content.some(
          (c) => 'transcript' in c && c.transcript
        )
      });

      return textContent;
    })
    .filter(Boolean)
    .map((text) => ({
      type: 'text' as const,
      text
    }));

  if (parts.length === 0) return null;

  // Use the first item's ID and role for the grouped message
  const firstItem = items[0];

  return {
    id: firstItem.itemId,
    role: firstItem.role as 'user' | 'assistant' | 'system',
    parts
  };
};

export default createGroupedMessage;
