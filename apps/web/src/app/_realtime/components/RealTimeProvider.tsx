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
  connect: () => void;
  disconnect: () => void;
  connectionState:
    | 'disconnected'
    | 'connecting'
    | 'connected'
    | 'disconnecting';
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
  const chat = useChatContext();
  const api = useTRPC();

  const { data: dbChat } = useSuspenseQuery(
    api.chats.getOrCreate.queryOptions({
      agentId: agentSlug
    })
  );

  const {
    data: realTimeSessionToken,
    isLoading: tokenLoading,
    error: tokenError
  } = useQuery(
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

          if (msUntilRefetch < 10_000) {
            console.log(
              '🔄 Refetching ephemeral token in',
              msUntilRefetch,
              'ms'
            );
          }

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
              console.log('🔧 Tool called - initiating handover');

              // Always do handover when tool is called from realtime session
              // (We know we're in realtime mode because this tool only exists in the realtime agent)
              console.log('🔧 Tool handover: realtime → chat');

              chat.setMode('awaiting-tool-call');

              // Send the tool execution message to normal chat
              await chat.sendMessage({
                parts: [
                  {
                    type: 'text',
                    text: `[execute the tool executeSql with the query intent of "${queryIntent}" and the proposed query of "${proposedQuery}"]`
                  }
                ],
                role: 'user'
              });

              return 'Tool execution initiated, switching to chat mode...';
            }
          })
        ]
      }),
    [dbChat.agent.name]
  );

  const session = useMemo(
    () =>
      new RealtimeSession(agent, {
        model: 'gpt-realtime'
      }),
    [agent]
  );

  useEffect(() => {
    return () => {
      if (session) {
        session.close();
      }
    };
  }, [session]);

  const { mutate: syncMessages, isPending } = useMutation(
    api.realtime.syncMessages.mutationOptions({
      onError: (error) => {
        console.error('Failed to sync realtime messages:', error);
      }
    })
  );

  useEffect(() => {
    const handleHistoryUpdate = (history: RealtimeItem[]) => {
      const newRealtimeMessages = filterNewMessages(history, chat.messages);
      const newUIMessages = convertRealtimeToUI(newRealtimeMessages);

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

  const {
    mutate: connect,
    isPending: isConnecting,
    data: connected
  } = useMutation({
    mutationFn: async () => {
      console.log('🔌 Connecting to realtime...');

      if (!realTimeSessionToken?.value) {
        console.error('❌ No ephemeral token available');
        throw new Error('No ephemeral token found');
      }

      await session.connect({
        apiKey: realTimeSessionToken?.value
      });

      const realtimeHistory = convertUIToRealtime(chat.messages);
      if (realtimeHistory.length > 0) {
        session.updateHistory(realtimeHistory);
      }

      return true;
    },
    onSuccess: () => {
      console.log('✅ Realtime connected');
      chat.setMode('realtime');
    },
    onError: (error) => {
      console.error('❌ Connection failed:', error);
      toast.error(`Failed to connect to realtime session: ${error.message}`);
      chat.setMode('chat');
    }
  });

  const {
    mutate: disconnect,
    isPending: isDisconnecting,
    data: disconnected
  } = useMutation({
    mutationFn: async () => {
      console.log('🔌 Disconnecting from realtime...');
      session.close();

      return true;
    },
    onSuccess: () => {
      console.log('✅ Realtime disconnected');
      chat.setMode('chat');
      setSyncedMessageIds(new Set());
    },
    onError: (error) => {
      console.error('❌ Disconnect failed:', error);
      toast.error(
        `Failed to disconnect from realtime session: ${error.message}`
      );
    }
  });

  const connectionState = useMemo(() => {
    if (isConnecting) {
      return 'connecting';
    }

    if (connected) {
      return 'connected';
    }

    if (isDisconnecting) {
      return 'disconnecting';
    }

    if (disconnected) {
      return 'disconnected';
    }

    return 'disconnected';
  }, [isConnecting, isDisconnecting, connected, disconnected]);

  useEffect(() => {
    if (session.history.length === 0 || connectionState !== 'connected') {
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
    connectionState,
    isPending,
    chat.id,
    syncMessages,
    syncedMessageIds
  ]);

  return (
    <RealTimeContext.Provider
      value={{
        agent,
        session,
        connectionState,
        connect,
        disconnect,
        canConnect:
          !!realTimeSessionToken?.value && !tokenLoading && !tokenError
      }}
    >
      {children}
    </RealTimeContext.Provider>
  );
};

export default RealTimeProvider;
