import { UIMessage } from 'ai';

import { RealtimeItem } from '../schemas/realtimeItemSchema';

/**
 * Converts UIMessages to realtime session format for providing context to new
 * sessions Only converts text content as realtime sessions have limited type
 * support
 */
const convertUIToRealtime = (uiMessages: UIMessage[]): RealtimeItem[] => {
  return uiMessages
    .filter(
      (message) =>
        // Only include user, assistant, and system messages
        ['user', 'assistant', 'system'].includes(message.role) &&
        // Only process messages that have text content
        message.parts.some((part) => part.type === 'text')
    )
    .map((message) => {
      // Extract text content from all text parts
      const textContent = message.parts
        .filter((part) => part.type === 'text')
        .map((part) => ('text' in part ? part.text : ''))
        .filter(Boolean)
        .join(' ');

      // Convert to realtime format based on role
      if (message.role === 'system') {
        return {
          itemId: message.id,
          type: 'message' as const,
          role: 'system' as const,
          content: [
            {
              type: 'input_text' as const,
              text: textContent
            }
          ]
        };
      }

      if (message.role === 'user') {
        return {
          itemId: message.id,
          type: 'message' as const,
          role: 'user' as const,
          status: 'completed' as const,
          content: [
            {
              type: 'input_text' as const,
              text: textContent
            }
          ]
        };
      }

      // Assistant role
      return {
        itemId: message.id,
        type: 'message' as const,
        role: 'assistant' as const,
        status: 'completed' as const,
        content: [
          {
            type: 'output_text' as const,
            text: textContent
          }
        ]
      };
    });
};

export default convertUIToRealtime;
