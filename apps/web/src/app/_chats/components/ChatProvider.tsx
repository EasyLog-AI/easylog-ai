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
  mode: 'chat' | 'realtime';
  setMode: (mode: 'chat' | 'realtime') => void;
  shouldReturnToRealtime: boolean;
  setShouldReturnToRealtime: (should: boolean) => void;
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
  const [mode, setMode] = useState<'chat' | 'realtime'>('chat');
  const [shouldReturnToRealtime, setShouldReturnToRealtime] = useState(false);

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
      // If we should return to realtime, do it now
      if (shouldReturnToRealtime) {
        console.log('🔄 Returning to realtime mode after tool completion');
        setMode('realtime');
        setShouldReturnToRealtime(false);
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

  // No complex state machine needed - onFinish handles the return to realtime

  return (
    <ChatContext.Provider
      value={{
        ...chat,
        mode,
        setMode: (newMode) => {
          console.log('🔄 Mode change:', { from: mode, to: newMode, caller: new Error().stack?.split('\n')[1] });
          setMode(newMode);
        },
        shouldReturnToRealtime,
        setShouldReturnToRealtime: (should) => {
          console.log('🔄 Should return to realtime change:', {
            from: shouldReturnToRealtime,
            to: should
          });
          setShouldReturnToRealtime(should);
        }
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider;
