'use client';

import { UseChatHelpers, useChat } from '@ai-sdk/react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { DefaultChatTransport } from 'ai';
import { createContext, useEffect, useRef } from 'react';

import useTRPC from '@/lib/trpc/browser';
import lastAssistantMessageIsCompleteWithToolCalls from '@/utils/lastAssistantMessageIsCompleteWithToolCalls';

import useChatMode from '../hooks/useChatMode';
import executingToolSchema from '../schemas/executingToolSchema';
import mediaImageSchema from '../schemas/mediaImageSchema';
import multipleChoiceSchema from '../schemas/multipleChoiceSchema';
import researchSchema from '../schemas/researchSchema';
import {
  barChartSchema,
  lineChartSchema,
  pieChartSchema,
  stackedBarChartSchema
} from '../tools/charts/schemas';
import { ChatMessage } from '../types';

interface ChatContextType extends UseChatHelpers<ChatMessage> {}

export const ChatContext = createContext<ChatContextType | undefined>(
  undefined
);

interface ChatProviderProps {
  agentSlug: string;
}

const ChatProvider = ({
  children,
  agentSlug
}: React.PropsWithChildren<ChatProviderProps>) => {
  const api = useTRPC();
  const { setMode } = useChatMode();

  const didStartChatRef = useRef(false);

  const { data: dbChat, refetch } = useSuspenseQuery(
    api.chats.getOrCreate.queryOptions({
      agentId: agentSlug
    })
  );

  const chat = useChat({
    id: dbChat.id,
    transport: new DefaultChatTransport({
      api: `/api/${agentSlug}/chat`,
      prepareSendMessagesRequest({ messages, id }) {
        return {
          body: { message: messages[messages.length - 1], id }
        };
      }
    }),
    messages: dbChat.messages as ChatMessage[],
    dataPartSchemas: {
      'bar-chart': barChartSchema,
      'line-chart': lineChartSchema,
      'stacked-bar-chart': stackedBarChartSchema,
      'pie-chart': pieChartSchema,
      research: researchSchema,
      'executing-tool': executingToolSchema,
      'multiple-choice': multipleChoiceSchema,
      'media-image': mediaImageSchema
    },
    sendAutomaticallyWhen: (args) => {
      return lastAssistantMessageIsCompleteWithToolCalls(args);
    },
    onToolCall: async ({ toolCall }) => {
      console.log('🔧 Tool call received:', {
        toolName: toolCall.toolName,
        toolCallId: toolCall.toolCallId
      });

      if (toolCall.toolName === 'clearChat') {
        console.log('[clearChat] Clearing chat and reloading page...');
        didStartChatRef.current = false;
        await refetch();

        /**
         * Full page reload is required after clearChat because:
         *
         * 1. ToolClearChat creates a NEW chat in the database
         * 2. UseChat's id prop doesn't update when dbChat.id changes
         * 3. This causes a state mismatch between the old chat ID and new chat
         * 4. Reload ensures ChatProvider re-initializes with the new chat ID
         */
        window.location.reload();
      }
    },
    onFinish: () => {
      console.log('🔧 Chat finished, switching to chat-finished mode');
      setMode('chat-finished');
      console.log('✅ Chat finished');
    },
    experimental_throttle: 50
  });

  useEffect(() => {
    const shouldAutoStart =
      chat.messages.length === 0 &&
      chat.status === 'ready' &&
      !didStartChatRef.current &&
      dbChat.agent?.autoStartMessage;

    if (!shouldAutoStart || !dbChat.agent?.autoStartMessage) {
      return;
    }

    didStartChatRef.current = true;

    void chat.sendMessage({ text: dbChat.agent.autoStartMessage });
  }, [dbChat.agent?.autoStartMessage, chat]);

  return (
    <ChatContext.Provider
      value={{
        ...chat
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider;
