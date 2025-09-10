import { UIMessage } from 'ai';

import {
  RealtimeItem,
  RealtimeMessageItem
} from '../schemas/realtimeItemSchema';

/**
 * Converts realtime messages to UIMessage format for persistence Only processes
 * completed message items, filtering out tool calls and incomplete messages
 */
export function convertRealtimeMessagesToUIMessages(
  realtimeItems: RealtimeItem[]
): UIMessage[] {
  return realtimeItems
    .filter(
      (item): item is RealtimeMessageItem =>
        item.type === 'message' &&
        ('status' in item ? item.status === 'completed' : true)
    )
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
            return content.transcript || '';
          }
          return '';
        })
        .filter(Boolean)
        .join(' ');

      return {
        id: item.itemId,
        role: item.role as 'user' | 'assistant' | 'system',
        parts: [
          {
            type: 'text' as const,
            text: textContent
          }
        ]
      };
    });
}

/** Filter out realtime messages that already exist in chat messages */
export function getNewRealtimeMessages(
  realtimeItems: RealtimeItem[],
  existingMessages: UIMessage[]
): RealtimeItem[] {
  const existingIds = new Set(existingMessages.map((msg) => msg.id));
  return realtimeItems.filter((item) => !existingIds.has(item.itemId));
}
