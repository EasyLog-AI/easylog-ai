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
  toolExecutionState: 'idle' | 'executing' | 'completed';
  setToolExecutionState: (state: 'idle' | 'executing' | 'completed') => void;
  pendingRealtimeReturn: boolean;
  setPendingRealtimeReturn: (pending: boolean) => void;
  justCompletedToolExecution: boolean;
  setJustCompletedToolExecution: (completed: boolean) => void;
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
  const [toolExecutionState, setToolExecutionState] = useState<
    'idle' | 'executing' | 'completed'
  >('idle');
  const [pendingRealtimeReturn, setPendingRealtimeReturn] = useState(false);
  const [justCompletedToolExecution, setJustCompletedToolExecution] =
    useState(false);

  const { data: dbChat, refetch } = useSuspenseQuery(
    api.chats.getOrCreate.queryOptions({
      agentId: agentSlug
    })
  );

  console.log('📊 ChatProvider database chat loaded:', {
    chatId: dbChat.id,
    agentName: dbChat.agent.name,
    messagesCount: dbChat.messages?.length || 0,
    autoStartMessage: dbChat.agent?.autoStartMessage
  });

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
        console.log('🗑️ Clearing chat and refetching...');
        setDidStartChat(false);
        await refetch();
      }
    },
    onFinish: () => {
      console.log('✅ Chat finished, setting tool execution to completed');
      setToolExecutionState((prev) => {
        console.log('⚙️ Tool execution state change:', {
          from: prev,
          to: 'completed'
        });
        return 'completed';
      });
    },
    experimental_throttle: 50
  });

  // Enhanced logging
  console.log('💬 ChatProvider render:', {
    agentSlug,
    didStartChat,
    mode,
    messageCount: chat.messages?.length || 0,
    chatStatus: chat.status
  });

  useEffect(() => {
    const shouldAutoStart =
      chat.messages.length === 0 &&
      chat.status === 'ready' &&
      !didStartChat &&
      dbChat.agent?.autoStartMessage;

    console.log('🚀 Auto-start effect:', {
      messagesLength: chat.messages.length,
      chatStatus: chat.status,
      didStartChat,
      hasAutoStartMessage: !!dbChat.agent?.autoStartMessage,
      autoStartMessage: dbChat.agent?.autoStartMessage,
      shouldAutoStart
    });

    if (shouldAutoStart && dbChat.agent?.autoStartMessage) {
      console.log(
        '🚀 Auto-starting chat with message:',
        dbChat.agent.autoStartMessage
      );
      setDidStartChat(true);
      void chat.sendMessage({ text: dbChat.agent.autoStartMessage });
    }
  }, [chat, didStartChat, dbChat.agent?.autoStartMessage]);

  // State machine for tool execution and realtime handover
  useEffect(() => {
    console.log('🔧 State machine effect:', {
      toolExecutionState,
      pendingRealtimeReturn,
      mode,
      chatStatus: chat.status
    });

    // When tool execution completes and we need to return to realtime
    if (
      toolExecutionState === 'completed' &&
      pendingRealtimeReturn &&
      chat.status === 'ready'
    ) {
      console.log('🔄 Tool completed, returning to realtime mode');
      setMode((prev) => {
        console.log('🔄 Mode change:', { from: prev, to: 'realtime' });
        return 'realtime';
      });
      setPendingRealtimeReturn((prev) => {
        console.log('🔄 Pending realtime return change:', {
          from: prev,
          to: false
        });
        return false;
      });
      setToolExecutionState((prev) => {
        console.log('⚙️ Tool execution state change:', {
          from: prev,
          to: 'idle'
        });
        return 'idle';
      });
      setJustCompletedToolExecution(true);
    }
  }, [toolExecutionState, pendingRealtimeReturn, mode, chat.status]);

  return (
    <ChatContext.Provider
      value={{
        ...chat,
        mode,
        setMode: (newMode) => {
          console.log('🔄 Mode change:', { from: mode, to: newMode });
          setMode(newMode);
        },
        toolExecutionState,
        setToolExecutionState: (newState) => {
          console.log('⚙️ Tool execution state change:', {
            from: toolExecutionState,
            to: newState
          });
          setToolExecutionState(newState);
        },
        pendingRealtimeReturn,
        setPendingRealtimeReturn: (pending) => {
          console.log('🔄 Pending realtime return change:', {
            from: pendingRealtimeReturn,
            to: pending
          });
          setPendingRealtimeReturn(pending);
        },
        justCompletedToolExecution,
        setJustCompletedToolExecution: (completed) => {
          console.log('🔄 Just completed tool execution change:', {
            from: justCompletedToolExecution,
            to: completed
          });
          setJustCompletedToolExecution(completed);
        }
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider;
