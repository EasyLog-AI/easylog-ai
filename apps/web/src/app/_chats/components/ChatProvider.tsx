'use client';

import { UseChatHelpers, useChat } from '@ai-sdk/react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { DefaultChatTransport, UIMessage, isToolOrDynamicToolUIPart } from 'ai';
import { createContext, useEffect, useState } from 'react';
import z from 'zod';

import internalChartConfigSchema from '@/app/_charts/schemas/internalChartConfigSchema';
import useTRPC from '@/lib/trpc/browser';

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

interface ChatContextType extends UseChatHelpers<ChatMessage> {}

export const ChatContext = createContext<ChatContextType | undefined>(
  undefined
);

/**
 * Check if the message is an assistant message with completed tool calls. The
 * last step of the message must have at least one tool invocation and all tool
 * invocations must have a result.
 *
 * This function skips automatic sending if the tool call includes a create
 * multiple choice tool call.
 */
function lastAssistantMessageIsCompleteWithToolCalls({
  messages
}: {
  messages: UIMessage[];
}): boolean {
  const message = messages[messages.length - 1];

  if (!message) {
    return false;
  }

  if (message.role !== 'assistant') {
    return false;
  }

  const lastStepStartIndex = message.parts.reduce((lastIndex, part, index) => {
    return part.type === 'step-start' ? index : lastIndex;
  }, -1);

  const lastStepToolInvocations = message.parts
    .slice(lastStepStartIndex + 1)
    .filter(isToolOrDynamicToolUIPart);

  // Alternative approach: Check if there are any multiple choice data parts in the message
  const hasMultipleChoiceData = message.parts.some(
    (part) => part.type === 'data-multiple-choice'
  );

  // If there's a multiple choice data part, don't auto-send
  if (hasMultipleChoiceData) {
    return false;
  }

  return (
    lastStepToolInvocations.length > 0 &&
    lastStepToolInvocations.every((part) => part.state === 'output-available')
  );
}

interface ChatProviderProps {
  agentSlug: string;
}

const ChatProvider = ({
  children,
  agentSlug
}: React.PropsWithChildren<ChatProviderProps>) => {
  const api = useTRPC();

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
      research: researchSchema,
      'multiple-choice': multipleChoiceSchema
    },
    sendAutomaticallyWhen: (args) => {
      return lastAssistantMessageIsCompleteWithToolCalls(args);
    },
    onToolCall: async ({ toolCall }) => {
      if (toolCall.toolName === 'clearChat') {
        setDidStartChat(false);
        await refetch();
      }
    },
    experimental_throttle: 50
  });

  useEffect(() => {
    if (
      chat.messages.length === 0 &&
      chat.status === 'ready' &&
      !didStartChat &&
      dbChat.agent?.autoStartMessage
    ) {
      setDidStartChat(true);
      void chat.sendMessage({ text: dbChat.agent.autoStartMessage });
    }
  }, [chat, didStartChat, dbChat.agent?.autoStartMessage]);

  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
};

export default ChatProvider;
