'use client';

import { RealtimeAgent, RealtimeSession, tool } from '@openai/agents-realtime';
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { UIMessage } from 'ai';
import { createContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import z from 'zod';

import useChatContext from '@/app/_chats/hooks/useChatContext';
import useTRPC from '@/lib/trpc/browser';

import { RealtimeItem } from '../schemas/realtimeItemSchema';
import convertRealtimeToUI from '../utils/convertRealtimeToUI';
import convertUIToRealtime from '../utils/convertUIToRealtime';
import filterNewMessages from '../utils/filterNewMessages';

interface RealTimeContextType {
  agent: RealtimeAgent;
  session: RealtimeSession;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  isConnecting: boolean;
  isDisconnecting: boolean;
  canConnect: boolean;
}

export const RealTimeContext = createContext<RealTimeContextType | undefined>(
  undefined
);

interface RealTimeProviderProps {
  agentSlug: string;
}

const RealTimeProvider = ({
  children,
  agentSlug
}: React.PropsWithChildren<RealTimeProviderProps>) => {
  const [isConnected, setIsConnected] = useState(false);

  const chat = useChatContext();
  const api = useTRPC();

  const { data: dbChat } = useSuspenseQuery(
    api.chats.getOrCreate.queryOptions({
      agentId: agentSlug
    })
  );

  const { data: realTimeSessionToken } = useQuery(
    api.realtime.createEphemeralToken.queryOptions(
      {
        chatId: dbChat.id
      },
      {
        refetchInterval: ({ state }) => {
          if (!state.data?.expires_at) return false;
          const now = Date.now();
          const expiresAtMs = state.data.expires_at * 1000;
          // Refetch 10 seconds before expiration, but never less than 1 second from now
          const msUntilRefetch = Math.max(expiresAtMs - now - 10000, 1000);
          console.log('Refetching ephemeral token in', msUntilRefetch, 'ms');
          return msUntilRefetch;
        }
      }
    )
  );

  const agent = useMemo(
    () =>
      new RealtimeAgent({
        name: dbChat.agent.name,
        instructions:
          'je bent een agent die kan uitvoeren van SQL queries op de Easylog database.',
        voice: 'marin',
        tools: [
          tool({
            name: 'execute_sql',
            description: 'Execute a SQL query on the Easylog database',
            parameters: z.object({
              queryIntent: z.string(),
              proposedQuery: z.string().nullable()
            }),
            execute: async ({ queryIntent, proposedQuery }) => {
              console.log('Executing SQL query', queryIntent, proposedQuery);

              await chat.sendMessage({
                parts: [
                  {
                    type: 'text',
                    text: `[execute the tool executeSql with the query intent of "${queryIntent}" and the proposed query of "${proposedQuery}"]`
                  }
                ],
                role: 'user'
              });

              chat.setIsWaitingForToolCall(true);
            }
          })
        ]
      }),
    [dbChat.agent.name, dbChat.agent.prompt]
  );

  const session = useMemo(
    () =>
      new RealtimeSession(agent, {
        model: 'gpt-realtime'
      }),
    [agent]
  );

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
      const newRealtimeMessages = filterNewMessages(history, chat.messages);
      const newUIMessages = convertRealtimeToUI(newRealtimeMessages);

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

  const { mutate: connect, isPending: isConnecting } = useMutation({
    mutationFn: async () => {
      if (!realTimeSessionToken?.value) {
        throw new Error('No ephemeral token found');
      }

      await session.connect({
        apiKey: realTimeSessionToken?.value
      });

      const realtimeHistory = convertUIToRealtime(chat.messages);
      if (realtimeHistory.length > 0) {
        session.updateHistory(realtimeHistory);
        console.log(
          `Initialized realtime session with ${realtimeHistory.length} historical messages`
        );
      }
    },
    onSuccess: () => {
      chat.setMode('realtime');
      setIsConnected(true);
    },
    onError: (error) => {
      toast.error(`Failed to connect to realtime session: ${error.message}`);
      setIsConnected(false);
      chat.setMode('chat');
    }
  });

  const { mutate: disconnect, isPending: isDisconnecting } = useMutation({
    mutationFn: async () => {
      session.close();
    },
    onSuccess: () => {
      setIsConnected(false);
      chat.setMode('chat');
      setSyncedMessageIds(new Set());
    },
    onError: (error) => {
      toast.error(
        `Failed to disconnect from realtime session: ${error.message}`
      );
    }
  });

  useEffect(() => {
    if (
      chat.mode === 'realtime' &&
      chat.isWaitingForToolCall &&
      isConnected &&
      !isDisconnecting
    ) {
      session.interrupt();
      void disconnect();
    }
  }, [
    chat.isWaitingForToolCall,
    isConnected,
    disconnect,
    session,
    chat.mode,
    isDisconnecting
  ]);

  useEffect(() => {
    if (
      chat.mode === 'realtime' &&
      !chat.isWaitingForToolCall &&
      !isConnected &&
      !isConnecting
    ) {
      void connect();
    }
  }, [
    chat.isWaitingForToolCall,
    isConnected,
    connect,
    session,
    chat.mode,
    isConnecting
  ]);

  useEffect(() => {
    if (isConnected) {
      console.log('Continuing conversation');
      session.sendMessage({
        type: 'message',
        role: 'user',
        content: [
          { type: 'input_text', text: '[naturally continue the conversation]' }
        ]
      });
    }
  }, [isConnected, session]);

  return (
    <RealTimeContext.Provider
      value={{
        agent,
        session,
        isConnected,
        connect,
        disconnect,
        isConnecting,
        isDisconnecting,
        canConnect: !!realTimeSessionToken?.value
      }}
    >
      {children}
    </RealTimeContext.Provider>
  );
};

export default RealTimeProvider;
