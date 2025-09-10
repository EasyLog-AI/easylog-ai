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
  realtimeMode: RealtimeMode;
}

export const RealTimeContext = createContext<RealTimeContextType | undefined>(
  undefined
);

type RealtimeMode =
  | 'disconnected' // Not in realtime mode
  | 'connecting' // Connecting to realtime
  | 'active'; // Active realtime conversation

interface RealTimeProviderProps {
  agentSlug: string;
}

const RealTimeProvider = ({
  children,
  agentSlug
}: React.PropsWithChildren<RealTimeProviderProps>) => {
  const [isConnected, setIsConnected] = useState(false);
  const [realtimeMode, setRealtimeMode] =
    useState<RealtimeMode>('disconnected');

  const chat = useChatContext();
  const api = useTRPC();

  // Enhanced logging
  console.log('🔄 RealTimeProvider render:', {
    isConnected,
    realtimeMode,
    agentSlug,
    chatId: chat.id,
    chatMode: chat.mode,
    toolExecutionState: chat.toolExecutionState,
    pendingRealtimeReturn: chat.pendingRealtimeReturn,
    messagesCount: chat.messages.length
  });

  const { data: dbChat } = useSuspenseQuery(
    api.chats.getOrCreate.queryOptions({
      agentId: agentSlug
    })
  );

  console.log('📊 Database chat loaded:', {
    chatId: dbChat.id,
    agentName: dbChat.agent.name,
    messagesCount: dbChat.messages?.length || 0
  });

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
          console.log('🔄 Refetching ephemeral token in', msUntilRefetch, 'ms');
          return msUntilRefetch;
        }
      }
    )
  );

  console.log('🎟️ Ephemeral token status:', {
    hasToken: !!realTimeSessionToken?.value,
    tokenExpiry: realTimeSessionToken?.expires_at
      ? new Date(realTimeSessionToken.expires_at * 1000).toISOString()
      : null,
    isLoading: tokenLoading,
    error: tokenError?.message
  });

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
              console.log(
                '🔧 SQL tool called in realtime, initiating handover...',
                {
                  queryIntent,
                  proposedQuery,
                  currentMode: chat.mode
                }
              );

              // Mark that we're executing a tool and need to return to realtime
              chat.setToolExecutionState('executing');
              chat.setPendingRealtimeReturn(true);

              // Switch to normal chat mode for tool execution
              console.log(
                '🔄 Switching to normal chat mode for tool execution'
              );
              chat.setMode('chat');

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

              // Return a simple acknowledgment - the session will be disconnected after this
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

  // Cleanup session on unmount to prevent WebRTC errors
  useEffect(() => {
    return () => {
      if (session) {
        console.log('🧹 Cleaning up session on unmount');
        session.close();
      }
    };
  }, [session]);

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
      setRealtimeMode('connecting');
      console.log('🔌 Starting connection process...', {
        realtimeMode: 'connecting',
        hasToken: !!realTimeSessionToken?.value,
        tokenLoading,
        tokenError: tokenError?.message,
        tokenExpiry: realTimeSessionToken?.expires_at
          ? new Date(realTimeSessionToken.expires_at * 1000).toISOString()
          : null
      });

      if (!realTimeSessionToken?.value) {
        console.error('❌ No ephemeral token found for connection', {
          tokenExists: !!realTimeSessionToken,
          tokenValue: !!realTimeSessionToken?.value,
          tokenLoading,
          tokenError: tokenError?.message
        });
        throw new Error('No ephemeral token found');
      }

      console.log('🔑 Using ephemeral token:', {
        tokenExists: !!realTimeSessionToken.value,
        expiresAt: new Date(
          realTimeSessionToken.expires_at * 1000
        ).toISOString()
      });

      await session.connect({
        apiKey: realTimeSessionToken?.value
      });

      console.log('✅ Session connected successfully');

      const realtimeHistory = convertUIToRealtime(chat.messages);
      if (realtimeHistory.length > 0) {
        session.updateHistory(realtimeHistory);
        console.log(
          `📚 Initialized realtime session with ${realtimeHistory.length} historical messages`
        );
      } else {
        console.log('📚 No historical messages to initialize');
      }
    },
    onSuccess: () => {
      console.log(
        '🎉 Connection successful, switching to active realtime mode'
      );
      setRealtimeMode('active');
      chat.setMode('realtime');
      setIsConnected(true);

      // If we just completed a tool execution, send a continuation message
      if (chat.justCompletedToolExecution) {
        console.log(
          '🔄 Reconnected after tool execution, sending continuation message'
        );
        setTimeout(() => {
          session.sendMessage({
            type: 'message',
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: '[naturally continue the current conversation]'
              }
            ]
          });
          // Clear the flag after sending the message
          chat.setJustCompletedToolExecution(false);
        }, 100); // Small delay to ensure session is fully ready
      }
    },
    onError: (error) => {
      console.error('❌ Connection failed:', error);
      toast.error(`Failed to connect to realtime session: ${error.message}`);
      setRealtimeMode('disconnected');
      setIsConnected(false);
      chat.setMode('chat');
    }
  });

  const { mutate: disconnect, isPending: isDisconnecting } = useMutation({
    mutationFn: async () => {
      console.log('🔌 Starting disconnect process...');
      session.close();
    },
    onSuccess: () => {
      console.log('🔚 Disconnected successfully');
      setIsConnected(false);
      setRealtimeMode('disconnected');
      // Only switch to chat mode if we're not in a tool handover scenario
      if (chat.mode === 'realtime' && !chat.pendingRealtimeReturn) {
        console.log('💬 Manual disconnect, switching to chat mode');
        chat.setMode('chat');
      }
      setSyncedMessageIds(new Set());
    },
    onError: (error) => {
      console.error('❌ Disconnect failed:', error);
      toast.error(
        `Failed to disconnect from realtime session: ${error.message}`
      );
    }
  });

  // Simple state machine - just react to mode changes
  useEffect(() => {
    console.log('🔧 Realtime connection effect:', {
      chatMode: chat.mode,
      realtimeMode,
      isConnected,
      isConnecting,
      isDisconnecting
    });

    // Connect when switching to realtime mode
    if (chat.mode === 'realtime' && !isConnected && !isConnecting) {
      console.log('🚀 Switching to realtime, connecting...', {
        hasToken: !!realTimeSessionToken?.value,
        tokenLoading: tokenLoading,
        tokenError: tokenError?.message
      });
      setRealtimeMode('connecting');
      void connect();
    }

    // Disconnect when switching to chat mode
    if (chat.mode === 'chat' && isConnected && !isDisconnecting) {
      console.log('💬 Switching to chat, disconnecting...');
      session.interrupt();
      void disconnect();
    }
  }, [
    chat.mode,
    isConnected,
    isConnecting,
    isDisconnecting,
    connect,
    disconnect,
    session,
    realtimeMode,
    realTimeSessionToken?.value,
    tokenLoading,
    tokenError
  ]);

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
        canConnect:
          !!realTimeSessionToken?.value && !tokenLoading && !tokenError,
        realtimeMode
      }}
    >
      {children}
    </RealTimeContext.Provider>
  );
};

export default RealTimeProvider;
