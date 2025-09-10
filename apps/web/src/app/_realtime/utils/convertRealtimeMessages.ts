import { UIMessage } from 'ai';

import {
  RealtimeItem,
  RealtimeMessageItem
} from '../schemas/realtimeItemSchema';

/**
 * Converts realtime messages to UIMessage format for persistence
 * Only groups consecutive user messages into parts - keeps assistant messages separate
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
  let currentUserGroup: RealtimeMessageItem[] = [];

  for (const item of messageItems) {
    if (item.role === 'user') {
      // Add to current user group
      currentUserGroup.push(item);
    } else {
      // Non-user message - finalize any pending user group first
      if (currentUserGroup.length > 0) {
        const userMessage = createGroupedMessage(currentUserGroup);
        if (userMessage) {
          groupedMessages.push(userMessage);
        }
        currentUserGroup = [];
      }
      
      // Create individual message for assistant/system messages
      const individualMessage = createIndividualMessage(item);
      if (individualMessage) {
        groupedMessages.push(individualMessage);
      }
    }
  }

  // Finalize any remaining user group
  if (currentUserGroup.length > 0) {
    const userMessage = createGroupedMessage(currentUserGroup);
    if (userMessage) {
      groupedMessages.push(userMessage);
    }
  }

  return groupedMessages;
}

function createIndividualMessage(item: RealtimeMessageItem): UIMessage | null {
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

  console.log('Converting individual realtime message:', {
    itemId: item.itemId,
    role: item.role,
    status: 'status' in item ? item.status : 'system',
    contentTypes: item.content.map(c => c.type),
    textContent,
    hasTranscript: item.content.some(c => 'transcript' in c && c.transcript)
  });

  if (!textContent) return null;

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

      console.log('Converting grouped realtime message:', {
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
