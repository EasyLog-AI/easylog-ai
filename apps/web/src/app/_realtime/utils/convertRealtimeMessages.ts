import { UIMessage } from 'ai';

import {
  RealtimeItem,
  RealtimeMessageItem
} from '../schemas/realtimeItemSchema';

/**
 * Converts realtime messages to UIMessage format for persistence
 * Groups consecutive user messages into parts of a single message
 * Includes both completed and in-progress messages to show live transcription
 */
export function convertRealtimeMessagesToUIMessages(
  realtimeItems: RealtimeItem[]
): UIMessage[] {
  const messageItems = realtimeItems.filter(
    (item): item is RealtimeMessageItem =>
      item.type === 'message'
      // Don't filter by status - include in-progress for live updates
  );

  const groupedMessages: UIMessage[] = [];
  let currentGroup: RealtimeMessageItem[] = [];
  let currentRole: string | null = null;

  for (const item of messageItems) {
    // If role changes or we hit a new conversation boundary, finalize current group
    if (currentRole !== null && currentRole !== item.role) {
      if (currentGroup.length > 0) {
        const groupedMessage = createGroupedMessage(currentGroup);
        if (groupedMessage) {
          groupedMessages.push(groupedMessage);
        }
      }
      currentGroup = [];
    }

    currentGroup.push(item);
    currentRole = item.role;
  }

  // Finalize the last group
  if (currentGroup.length > 0) {
    const groupedMessage = createGroupedMessage(currentGroup);
    if (groupedMessage) {
      groupedMessages.push(groupedMessage);
    }
  }

  return groupedMessages;
}

function createGroupedMessage(items: RealtimeMessageItem[]): UIMessage | null {
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
            return content.transcript || '';
          }
          return '';
        })
        .filter(Boolean)
        .join(' ');

      console.log('Converting realtime message:', {
        itemId: item.itemId,
        role: item.role,
        status: 'status' in item ? item.status : 'system',
        contentTypes: item.content.map(c => c.type),
        textContent,
        hasTranscript: item.content.some(c => 'transcript' in c && c.transcript)
      });

      return textContent;
    })
    .filter(Boolean)
    .map(text => ({
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
}

/** Filter out realtime messages that already exist in chat messages */
export function getNewRealtimeMessages(
  realtimeItems: RealtimeItem[],
  existingMessages: UIMessage[]
): RealtimeItem[] {
  const existingIds = new Set(existingMessages.map((msg) => msg.id));
  return realtimeItems.filter((item) => !existingIds.has(item.itemId));
}
