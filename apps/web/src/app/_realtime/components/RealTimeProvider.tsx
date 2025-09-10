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

import { RealtimeItem } from '../schemas/realtimeItemSchema';
import {
  convertRealtimeMessagesToUIMessages,
  getNewRealtimeMessages
} from '../utils/convertRealtimeMessages';
import { convertUIMessagesToRealtimeItems } from '../utils/convertUIMessagesToRealtime';

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

  const { mutate: syncMessages, isPending } = useMutation(
    api.realtime.syncMessages.mutationOptions({
      onSuccess: (result) => {
        console.log('Sync completed:', result);
      },
      onError: (error) => {
        console.error('Failed to sync realtime messages:', error);
      }
    })
  );

  useEffect(() => {
    const handleHistoryUpdate = (history: RealtimeItem[]) => {
      chat.setMessages([
        ...chat.messages,
        ...convertRealtimeMessagesToUIMessages(
          getNewRealtimeMessages(history, chat.messages)
        )
      ] as UIMessage<unknown, {}>[]);
    };

    session.on('history_updated', handleHistoryUpdate);

    return () => {
      session.off('history_updated', handleHistoryUpdate);
    };
  }, [session, chat]);

  useEffect(() => {
    if (session.history.length === 0 || !isConnected || isPending) {
      return;
    }

    // Only sync completed messages to backend
    const completedMessages = session.history.filter((item) => {
      if (item.type !== 'message') return false;

      // Check if message is completed and has actual content
      const isCompleted = 'status' in item ? item.status === 'completed' : true;
      const hasContent = item.content && item.content.length > 0;

      return isCompleted && hasContent;
    });

    const newCompletedMessages = getNewRealtimeMessages(
      completedMessages,
      chat.messages
    );

    if (newCompletedMessages.length === 0) {
      return;
    }

    console.log(
      'Syncing only completed messages to backend:',
      newCompletedMessages.length
    );
    syncMessages({
      chatId: chat.id,
      realtimeItems: completedMessages // Only send completed messages
    });
  }, [
    session.history,
    chat.messages,
    isConnected,
    isPending,
    chat.id,
    syncMessages
  ]);

  const connect = useCallback(async () => {
    await session.connect({
      apiKey: 'ek_68c1741eb7dc8191acbf4cf959d5737e'
    });

    const realtimeHistory = convertUIMessagesToRealtimeItems(chat.messages);
    if (realtimeHistory.length > 0) {
      session.updateHistory(realtimeHistory);
      console.log(
        `Initialized realtime session with ${realtimeHistory.length} historical messages`
      );
    }

    setIsConnected(true);
  }, [session, chat.messages]);

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
