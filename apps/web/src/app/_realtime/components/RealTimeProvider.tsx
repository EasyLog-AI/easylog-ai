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
      const newRealtimeMessages = getNewRealtimeMessages(
        history,
        chat.messages
      );
      const newUIMessages =
        convertRealtimeMessagesToUIMessages(newRealtimeMessages);

      console.log(
        'Frontend update - New realtime messages:',
        newRealtimeMessages.length
      );
      console.log('Frontend update - New UI messages:', newUIMessages.length);

      if (newUIMessages.length > 0) {
        chat.setMessages([...chat.messages, ...newUIMessages] as UIMessage<
          unknown,
          {}
        >[]);
      }
    };

    session.on('history_updated', handleHistoryUpdate);

    return () => {
      session.off('history_updated', handleHistoryUpdate);
    };
  }, [session, chat]);

  const [syncedMessageIds, setSyncedMessageIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (session.history.length === 0 || !isConnected || isPending) {
      return;
    }

    const completedMessages = session.history.filter((item) => {
      if (item.type !== 'message') return false;

      const isCompleted = 'status' in item ? item.status === 'completed' : true;
      const hasContent = item.content && item.content.length > 0;

      return isCompleted && hasContent;
    });

    const newCompletedMessages = completedMessages.filter(
      (item) => !syncedMessageIds.has(item.itemId)
    );

    if (newCompletedMessages.length === 0) {
      return;
    }

    console.log(
      'Syncing only completed messages to backend:',
      newCompletedMessages.length
    );

    const newSyncedIds = new Set([
      ...syncedMessageIds,
      ...newCompletedMessages.map((item) => item.itemId)
    ]);

    setSyncedMessageIds(newSyncedIds);

    syncMessages({
      chatId: chat.id,
      realtimeItems: completedMessages
    });
  }, [
    session.history,
    isConnected,
    isPending,
    chat.id,
    syncMessages,
    syncedMessageIds
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
    setSyncedMessageIds(new Set()); // Clear synced message tracking
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
