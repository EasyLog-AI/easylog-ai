'use client';

import { RealtimeAgent, RealtimeSession, tool } from '@openai/agents-realtime';
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { UIMessage } from 'ai';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';
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
  session: RealtimeSession | null;
  connect: () => void;
  disconnect: () => void;
  connectionState:
    | 'disconnected'
    | 'connecting'
    | 'connected'
    | 'disconnecting';
  canConnect: boolean;
  isEnabled: boolean;
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

  const [connectionState, setConnectionState] = useState<
    'disconnected' | 'connecting' | 'connected' | 'disconnecting'
  >('disconnected');

  const [session, setSession] = useState<RealtimeSession | null>(null);

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
        instructions: dbChat.agent.prompt,
        voice: dbChat.agent.voiceChatVoice,
        tools: [
          tool({
            name: 'search_knowledge_base',
            description: 'Search the knowledge base for information',
            parameters: z.object({
              query: z.string()
            }),
            execute: async ({ query }) => {
              console.log('🔧 Tool called - initiating handover');

              console.log('🔧 Tool handover: realtime → chat');

              chat.setMode('awaiting-tool-call');

              // Send the tool execution message to normal chat
              await chat.sendMessage({
                parts: [
                  {
                    type: 'text',
                    text: `[execute the tool searchKnowledgeBase with the query of "${query}"]`
                  }
                ],
                role: 'user'
              });

              return 'Tool execution initiated, switching to chat mode...';
            }
          }),
          tool({
            name: 'execute_sql',
            description: 'Execute a SQL query on the Easylog database',
            parameters: z.object({
              queryIntent: z.string(),
              proposedQuery: z.string().nullable()
            }),
            execute: async ({ queryIntent, proposedQuery }) => {
              console.log('🔧 Tool called - initiating handover');

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
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dbChat.agent.name]
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

    session?.on('history_updated', handleHistoryUpdate);

    return () => {
      session?.off('history_updated', handleHistoryUpdate);
    };
  }, [session, chat]);

  const [syncedMessageIds, setSyncedMessageIds] = useState<Set<string>>(
    new Set()
  );

  const connect = useCallback(async () => {
    setConnectionState('connecting');

    try {
      if (!realTimeSessionToken?.value) {
        console.error('❌ No ephemeral token available');
        throw new Error('No ephemeral token found');
      }

      const session = new RealtimeSession(agent, {
        model: 'gpt-realtime'
      });

      await session.connect({
        apiKey: realTimeSessionToken?.value
      });

      setSession(session);

      const realtimeHistory = convertUIToRealtime(chat.messages);
      if (realtimeHistory.length > 0) {
        session.updateHistory(realtimeHistory);
      }

      console.log('🔧 Connected to realtime session');
      setConnectionState('connected');

      if (chat.mode === 'tool-call-finished') {
        console.log('🔧 Naturally continuing conversation');
        session.sendMessage({
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: '[naturally continue our conversation]'
            }
          ]
        });
      }

      chat.setMode('realtime');
    } catch (error) {
      setConnectionState('disconnected');
      console.error('❌ Connection failed:', error);
      toast.error(
        `Failed to connect to realtime session: ${(error as Error).message}`
      );
      chat.setMode('chat');
    }
  }, [realTimeSessionToken?.value, agent, chat]);

  const disconnect = useCallback(async () => {
    setConnectionState('disconnecting');
    try {
      session?.close();
      setSyncedMessageIds(new Set());
      chat.setMode('chat');
      console.log('🔧 Disconnected from realtime session');
      setConnectionState('disconnected');
    } catch (error) {
      console.error('❌ Disconnect failed:', error);
      toast.error(
        `Failed to disconnect from realtime session: ${(error as Error).message}`
      );
    }
  }, [session, chat]);

  useEffect(() => {
    if (
      !session ||
      session.history.length === 0 ||
      connectionState !== 'connected'
    ) {
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
    session?.history,
    connectionState,
    isPending,
    chat.id,
    syncMessages,
    syncedMessageIds,
    session
  ]);

  useEffect(() => {
    if (connectionState === 'connected' && chat.mode === 'awaiting-tool-call') {
      console.log('🔌 Disconnecting from realtime...');
      void disconnect();
    } else if (
      connectionState === 'disconnected' &&
      chat.mode === 'tool-call-finished'
    ) {
      console.log('🔌 Connecting to realtime...');
      void connect();
    }
  }, [chat.mode, disconnect, connectionState, connect]);

  return (
    <RealTimeContext.Provider
      value={{
        agent,
        session,
        connectionState,
        connect,
        disconnect,
        canConnect:
          !!realTimeSessionToken?.value && !tokenLoading && !tokenError,
        isEnabled: dbChat.agent.voiceChatEnabled
      }}
    >
      {children}
    </RealTimeContext.Provider>
  );
};

export default RealTimeProvider;
