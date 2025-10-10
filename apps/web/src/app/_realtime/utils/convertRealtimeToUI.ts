import { ChatMessage } from '@/app/_chats/types';

import createGroupedMessage from './createGroupedMessage';
import createIndividualMessage from './createIndividualMessage';
import {
  RealtimeItem,
  RealtimeMessageItem
} from '../schemas/realtimeItemSchema';

/**
 * Converts realtime messages to UIMessage format for persistence Only groups
 * consecutive user messages into parts - keeps assistant messages separate
 * Includes both completed and in-progress messages to show live transcription
 */
const convertRealtimeToUI = (realtimeItems: RealtimeItem[]): ChatMessage[] => {
  const messageItems = realtimeItems.filter(
    (item): item is RealtimeMessageItem => item.type === 'message'
    // Don't filter by status - include in-progress for live updates
  );

  const groupedMessages: ChatMessage[] = [];
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
};

export default convertRealtimeToUI;
