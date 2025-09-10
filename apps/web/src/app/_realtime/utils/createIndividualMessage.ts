import { UIMessage } from 'ai';

import { RealtimeMessageItem } from '../schemas/realtimeItemSchema';

const createIndividualMessage = (
  item: RealtimeMessageItem
): UIMessage | null => {
  // Extract text content from the realtime message
  const textContent = item.content
    .map((content) => {
      if (content.type === 'input_text' || content.type === 'output_text') {
        return content.text;
      }
      if (content.type === 'input_audio' || content.type === 'output_audio') {
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
    contentTypes: item.content.map((c) => c.type),
    textContent,
    hasTranscript: item.content.some((c) => 'transcript' in c && c.transcript)
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
};

export default createIndividualMessage;
