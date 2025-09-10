'use client';

import { UseChatHelpers, useChat } from '@ai-sdk/react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { DefaultChatTransport, UIMessage } from 'ai';
import { createContext, useEffect, useState } from 'react';
import z from 'zod';

import internalChartConfigSchema from '@/app/_charts/schemas/internalChartConfigSchema';
import useTRPC from '@/lib/trpc/browser';
import lastAssistantMessageIsCompleteWithToolCalls from '@/utils/lastAssistantMessageIsCompleteWithToolCalls';

import multipleChoiceSchema from '../schemas/multipleChoiceSchema';
import researchSchema from '../schemas/researchSchema';

type ChatMessage = UIMessage<
  unknown,
  {
    chart: z.infer<typeof internalChartConfigSchema>;
    research: z.infer<typeof researchSchema>;
    'multiple-choice': z.infer<typeof multipleChoiceSchema>;
  }
>;

interface ChatContextType extends UseChatHelpers<ChatMessage> {
  mode: 'chat' | 'awaiting-tool-call' | 'tool-call-finished' | 'realtime';
  setMode: (
    mode: 'chat' | 'awaiting-tool-call' | 'tool-call-finished' | 'realtime'
  ) => void;
}

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

  const [didStartChat, setDidStartChat] = useState(false);
  const [mode, setMode] = useState<
    'chat' | 'awaiting-tool-call' | 'tool-call-finished' | 'realtime'
  >('chat');

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
      console.log('✅ Chat finished');
      if (mode === 'awaiting-tool-call') {
        console.log('🔧 Tool call finished');
        setMode('tool-call-finished');
      }
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
        ...chat,
        mode,
        setMode: (newMode) => {
          console.log(`🔄 Mode change: ${mode} → ${newMode}`);
          setMode(newMode);
        }
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider;
