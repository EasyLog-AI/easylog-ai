import { ChatMessage } from '@/app/_chats/types';

import { RealtimeMessageItem } from '../schemas/realtimeItemSchema';

const createGroupedMessage = (
  items: RealtimeMessageItem[]
): ChatMessage | null => {
  if (items.length === 0) return null;

  type TextPart = Extract<ChatMessage['parts'][number], { type: 'text' }>;

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
            return content.transcript ? `[${content.transcript}]` : null;
          }
          return null;
        })
        .filter(Boolean)
        .join(' ');

      return textContent;
    })
    .filter(Boolean)
    .map(
      (text): TextPart => ({
        type: 'text',
        text
      })
    );

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
