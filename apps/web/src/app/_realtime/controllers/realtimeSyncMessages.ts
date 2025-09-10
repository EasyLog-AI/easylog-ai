import { UIMessage } from 'ai';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import chatMiddleware from '@/app/_chats/middleware/chatMiddleware';
import db from '@/database/client';
import { chats } from '@/database/schema';

import { realtimeItemSchema } from '../schemas/realtimeItemSchema';
import convertRealtimeToUI from '../utils/convertRealtimeToUI';
import filterNewMessages from '../utils/filterNewMessages';

const realtimeSyncMessages = chatMiddleware
  .input(
    z.object({
      realtimeItems: z.array(realtimeItemSchema)
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { chat } = ctx;
    const { realtimeItems } = input;

    // Get current messages from chat
    const currentMessages = (chat.messages as UIMessage[]) || [];

    // Filter out messages that already exist
    const newRealtimeItems = filterNewMessages(realtimeItems, currentMessages);

    if (newRealtimeItems.length === 0) {
      return {
        success: true,
        addedCount: 0,
        messages: currentMessages
      };
    }

    // Convert realtime messages to UI message format
    const newUIMessages = convertRealtimeToUI(newRealtimeItems);

    if (newUIMessages.length === 0) {
      return {
        success: true,
        addedCount: 0,
        messages: currentMessages
      };
    }

    // Combine existing and new messages
    const updatedMessages = [...currentMessages, ...newUIMessages];

    // Persist to database using same pattern as chat route
    await db
      .update(chats)
      .set({
        messages: updatedMessages
      })
      .where(eq(chats.id, chat.id));

    return {
      success: true,
      addedCount: newUIMessages.length,
      messages: updatedMessages
    };
  });

export default realtimeSyncMessages;
