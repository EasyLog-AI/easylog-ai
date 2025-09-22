'use client';

import { UseChatHelpers, useChat } from '@ai-sdk/react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { DefaultChatTransport, UIMessage } from 'ai';
import { createContext, useEffect, useState } from 'react';
import z from 'zod';

import internalChartConfigSchema from '@/app/_charts/schemas/internalChartConfigSchema';
import { barChartSchema, lineChartSchema, stackedBarChartSchema, pieChartSchema } from '../tools/charts/schemas';
import useTRPC from '@/lib/trpc/browser';
import lastAssistantMessageIsCompleteWithToolCalls from '@/utils/lastAssistantMessageIsCompleteWithToolCalls';

import useChatMode from '../hooks/useChatMode';
import multipleChoiceSchema from '../schemas/multipleChoiceSchema';
import researchSchema from '../schemas/researchSchema';

type ChatMessage = UIMessage<
  unknown,
  {
    chart: z.infer<typeof internalChartConfigSchema>;
    'bar-chart': z.infer<typeof barChartSchema>;
    'line-chart': z.infer<typeof lineChartSchema>;
    'stacked-bar-chart': z.infer<typeof stackedBarChartSchema>;
    'pie-chart': z.infer<typeof pieChartSchema>;
    research: z.infer<typeof researchSchema>;
    'multiple-choice': z.infer<typeof multipleChoiceSchema>;
  }
>;

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

  const [didStartChat, setDidStartChat] = useState(false);

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
      chart: internalChartConfigSchema,
      'bar-chart': barChartSchema,
      'line-chart': lineChartSchema,
      'stacked-bar-chart': stackedBarChartSchema,
      'pie-chart': pieChartSchema,
      research: researchSchema,
      'multiple-choice': multipleChoiceSchema
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
        setDidStartChat(false);
        await refetch();
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
      !didStartChat &&
      dbChat.agent?.autoStartMessage;

    if (shouldAutoStart && dbChat.agent?.autoStartMessage) {
      setDidStartChat(true);
      void chat.sendMessage({ text: dbChat.agent.autoStartMessage });
    }
  }, [chat, didStartChat, dbChat.agent?.autoStartMessage]);

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
