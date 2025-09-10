'use client';

import { RealtimeAgent, RealtimeSession } from '@openai/agents-realtime';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';

import useChatContext from '../hooks/useChatContext';

interface RealTimeContextType {
  agent: RealtimeAgent;
  session: RealtimeSession;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export const RealTimeContext = createContext<RealTimeContextType | undefined>(
  undefined
);

interface RealTimeProviderProps {}

const RealTimeProvider = ({
  children
}: React.PropsWithChildren<RealTimeProviderProps>) => {
  const [isConnected, setIsConnected] = useState(false);

  const chat = useChatContext();

  const agent = useMemo(
    () =>
      new RealtimeAgent({
        name: 'Assistant',
        instructions: 'You are a helpful assistant.'
      }),
    []
  );

  const session = useMemo(
    () =>
      new RealtimeSession(agent, {
        model: 'gpt-realtime'
      }),
    [agent]
  );

  const convertRealtimeMessagesToChatMessages = useCallback(
    (realtimeMessages: unknown[]) => {
      return realtimeMessages.map((item: unknown) => {
        const message = item as {
          itemId: string;
          role: string;
          content: { transcript?: string }[];
        };
        return {
          id: message.itemId,
          role: message.role as 'user' | 'assistant' | 'system',
          parts: message.content.map((content) => ({
            text: content.transcript || '',
            type: 'text' as const
          }))
        };
      });
    },
    []
  );

  useEffect(() => {
    console.log('realtime history', session.history);
    console.log('chat messages', chat.messages);

    // Convert and sync realtime messages to chat
    if (session.history.length > 0) {
      const convertedMessages = convertRealtimeMessagesToChatMessages(
        session.history
      );

      // Only add new messages that aren't already in chat
      const existingChatIds = new Set(chat.messages.map((msg) => msg.id));
      const newMessages = convertedMessages.filter(
        (msg) => !existingChatIds.has(msg.id)
      );

      // For persistence, we need to send messages through the server
      // Using setMessages for now - messages will show in UI but won't persist
      if (newMessages.length > 0) {
        chat.setMessages([...chat.messages, ...newMessages]);
      }
    }
  }, [session.history, chat, convertRealtimeMessagesToChatMessages]);

  const connect = useCallback(async () => {
    await session.connect({
      apiKey: 'ek_68c160e530f88191af5bf99daf1c0f90'
    });
    setIsConnected(true);
  }, [session]);

  const disconnect = useCallback(() => {
    session.close();
    setIsConnected(false);
  }, [session]);

  return (
    <RealTimeContext.Provider
      value={{
        agent,
        session,
        isConnected,
        connect,
        disconnect
      }}
    >
      {children}
    </RealTimeContext.Provider>
  );
};

export default RealTimeProvider;
