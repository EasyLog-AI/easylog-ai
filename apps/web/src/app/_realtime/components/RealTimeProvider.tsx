'use client';

import { RealtimeAgent, RealtimeSession } from '@openai/agents-realtime';
import { useMutation } from '@tanstack/react-query';
import { UIMessage } from 'ai';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';

import useChatContext from '@/app/_chats/hooks/useChatContext';
import useTRPC from '@/lib/trpc/browser';

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

  const api = useTRPC();

  const { mutate: syncMessages } = useMutation(
    api.realtime.syncMessages.mutationOptions({
      onSuccess: (result) => {
        if (result.success && result.addedCount > 0) {
          // Update frontend state with the persisted messages
          chat.setMessages(result.messages as UIMessage<unknown, {}>[]);
        }
      },
      onError: (error) => {
        console.error('Failed to sync realtime messages:', error);
      }
    })
  );

  useEffect(() => {
    console.log('realtime history', session.history);
    console.log('chat messages', chat.messages);

    // Sync realtime messages with persistent storage
    if (session.history.length === 0) {
      return;
    }

    void syncMessages({
      chatId: chat.id,
      realtimeItems: session.history
    });
  }, [chat.id, chat.messages, session.history, syncMessages]);

  const connect = useCallback(async () => {
    await session.connect({
      apiKey: 'ek_68c168fd3a8c81918657da7b98e8225e'
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
