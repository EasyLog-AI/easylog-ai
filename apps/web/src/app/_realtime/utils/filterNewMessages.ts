import { UIMessage } from 'ai';

import { RealtimeItem } from '../schemas/realtimeItemSchema';

/** Filter out realtime messages that already exist in chat messages */
const filterNewMessages = (
  realtimeItems: RealtimeItem[],
  existingMessages: UIMessage[]
): RealtimeItem[] => {
  const existingIds = new Set(existingMessages.map((msg) => msg.id));
  return realtimeItems.filter((item) => !existingIds.has(item.itemId));
};

export default filterNewMessages;