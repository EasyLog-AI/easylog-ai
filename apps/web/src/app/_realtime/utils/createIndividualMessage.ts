import { ChatMessage } from '@/app/_chats/types';

import { RealtimeMessageItem } from '../schemas/realtimeItemSchema';

const createIndividualMessage = (
  item: RealtimeMessageItem
): ChatMessage | null => {
  const textContent = item.content
    .map((content) => {
      if (content.type === 'input_text' || content.type === 'output_text') {
        return content.text;
      }
      if (content.type === 'input_audio' || content.type === 'output_audio') {
        return content.transcript;
      }
      return null;
    })
    .filter(Boolean)
    .join(' ')
    .trim();

  console.log('Converting individual realtime message:', {
    itemId: item.itemId,
    role: item.role,
    status: 'status' in item ? item.status : 'system',
    contentTypes: item.content.map((c) => c.type),
    textContent,
    hasTranscript: item.content.some((c) => 'transcript' in c && c.transcript)
  });

  if (!textContent) return null;

  type TextPart = Extract<ChatMessage['parts'][number], { type: 'text' }>;

  const parts: TextPart[] = [
    {
      type: 'text',
      text: textContent
    }
  ];

  return {
    id: item.itemId,
    role: item.role as 'user' | 'assistant' | 'system',
    parts
  };
};

export default createIndividualMessage;
