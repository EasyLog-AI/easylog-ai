'use client';

import { RealtimeAgent, RealtimeSession, tool } from '@openai/agents-realtime';
import * as Sentry from '@sentry/nextjs';
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
  const { setMode, messages, setMessages, sendMessage, mode } =
    useChatContext();

  const api = useTRPC();

  const { data: dbChat } = useSuspenseQuery(
    api.chats.getOrCreate.queryOptions({
      agentId: agentSlug
    })
  );

  const isEnabled = dbChat.agent.voiceChatEnabled;

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

              setMode('awaiting-tool-call');

              // Send the tool execution message to normal chat
              await sendMessage({
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

              setMode('awaiting-tool-call');

              // Send the tool execution message to normal chat
              await sendMessage({
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
    [dbChat.agent]
  );

  const session = useMemo(() => {
    if (isEnabled) {
      return new RealtimeSession(agent, {
        model: 'gpt-realtime'
      });
    }
    return null;
  }, [agent, isEnabled]);

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
        Sentry.captureException(error);
      }
    })
  );

  useEffect(() => {
    const handleHistoryUpdate = (history: RealtimeItem[]) => {
      const newRealtimeMessages = filterNewMessages(history, messages);
      const newUIMessages = convertRealtimeToUI(newRealtimeMessages);

      if (newUIMessages.length > 0) {
        setMessages([...messages, ...newUIMessages] as UIMessage<
          unknown,
          {}
        >[]);
      }
    };

    session?.on('history_updated', handleHistoryUpdate);

    return () => {
      session?.off('history_updated', handleHistoryUpdate);
    };
  }, [session, messages, setMessages]);

  const [syncedMessageIds, setSyncedMessageIds] = useState<Set<string>>(
    new Set()
  );

  const connect = useCallback(async () => {
    if (!isEnabled) {
      console.log('🔧 Voice chat is disabled');
      return;
    }

    try {
      if (!realTimeSessionToken?.value) {
        console.error('❌ No ephemeral token available');
        throw new Error('No ephemeral token found');
      }

      await session?.connect({
        apiKey: realTimeSessionToken?.value
      });

      const realtimeHistory = convertUIToRealtime(messages);
      if (realtimeHistory.length > 0) {
        session?.updateHistory(realtimeHistory);
      }

      console.log('🔧 Connected to realtime session');

      if (mode === 'tool-call-finished') {
        console.log('🔧 Naturally continuing conversation');
        session?.sendMessage({
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

      setMode('realtime');
    } catch (error) {
      console.error('❌ Connection failed:', error);
      toast.error(
        `Failed to connect to realtime session: ${(error as Error).message}`
      );
      Sentry.captureException(error);
      if (mode !== 'awaiting-tool-call') {
        setMode('chat');
      } else {
        console.log(
          '🔧 Preserving awaiting-tool-call mode during connection error'
        );
      }
    }
  }, [
    isEnabled,
    realTimeSessionToken?.value,
    session,
    messages,
    mode,
    setMode
  ]);

  const disconnect = useCallback(async () => {
    try {
      session?.close();
      setSyncedMessageIds(new Set());
      if (mode === 'realtime') {
        console.log('🔧 Realtime mode finished');
        setMode('chat');
      } else if (mode === 'awaiting-tool-call') {
        console.log('🔧 Preserving awaiting-tool-call mode during handover');
      }
      console.log('🔧 Disconnected from realtime session');
    } catch (error) {
      console.error('❌ Disconnect failed:', error);
      toast.error(
        `Failed to disconnect from realtime session: ${(error as Error).message}`
      );
      Sentry.captureException(error);
    }
  }, [session, mode, setMode]);

  useEffect(() => {
    if (
      !session ||
      session.history.length === 0 ||
      session.transport.status !== 'connected'
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
      chatId: dbChat.id,
      realtimeItems: completedMessages
    });
  }, [
    session?.history,
    session?.transport.status,
    isPending,
    syncMessages,
    syncedMessageIds,
    session,
    dbChat.id
  ]);

  useEffect(() => {
    if (
      session?.transport.status === 'connected' &&
      mode === 'awaiting-tool-call' &&
      isEnabled
    ) {
      console.log('🔌 Disconnecting from realtime...');
      void disconnect();
    } else if (
      session?.transport.status === 'disconnected' &&
      mode === 'tool-call-finished' &&
      isEnabled
    ) {
      console.log('🔌 Connecting to realtime...');
      void connect();
    }
  }, [mode, disconnect, session?.transport.status, connect, isEnabled]);

  return (
    <RealTimeContext.Provider
      value={{
        agent,
        session,
        connectionState: session?.transport.status ?? 'disconnected',
        connect,
        disconnect,
        canConnect:
          !!realTimeSessionToken?.value && !tokenLoading && !tokenError,
        isEnabled
      }}
    >
      {children}
    </RealTimeContext.Provider>
  );
};

export default RealTimeProvider;
