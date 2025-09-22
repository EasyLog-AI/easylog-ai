'use client';

import {
  RealtimeAgent,
  RealtimeSession,
  TransportEvent,
  tool
} from '@openai/agents-realtime';
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

import useChatContext from '@/app/_chats/hooks/useChatContext';
import useChatMode from '@/app/_chats/hooks/useChatMode';
import toolsConfig from '@/app/_chats/tools/tools.config';
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
  isMuted: boolean;
  setIsMuted: (next: boolean) => void;
  isAgentTurn: boolean;
  connectionState:
    | 'disconnected'
    | 'connecting'
    | 'connected'
    | 'disconnecting';
  canConnect: boolean;
  isEnabled: boolean;
  isLoading: boolean;
  interrupt: () => void;
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
  const { messages, setMessages, sendMessage } = useChatContext();
  const { mode, setMode } = useChatMode();

  const api = useTRPC();

  const [isLoading, setIsLoading] = useState(false);
  const [isAgentTurn, setIsAgentTurn] = useState(false);
  const [syncedMessageIds, setSyncedMessageIds] = useState<Set<string>>(
    new Set()
  );

  const { data: dbChat } = useSuspenseQuery(
    api.chats.getOrCreate.queryOptions({
      agentId: agentSlug
    })
  );

  const isEnabled = dbChat.agent.voiceChatEnabled;
  const isAutoMuted = dbChat.agent.voiceChatAutoMute;

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
          ...Object.values(toolsConfig).map((toolConfig) =>
            tool({
              name: toolConfig.name,
              description: toolConfig.description,
              parameters: toolConfig.inputSchema,
              execute: async (args) => {
                console.log(
                  `🔧 Tool called: ${toolConfig.name} - initiating handover`
                );

                setMode('awaiting-tool-call');

                await sendMessage({
                  parts: [
                    {
                      type: 'text',
                      text: `[execute the tool ${toolConfig.name} with the arguments of ${JSON.stringify(args)}]`
                    }
                  ],
                  role: 'user'
                });

                return '[done]';
              }
            })
          )
        ]
      }),
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dbChat.agent.name, dbChat.agent.prompt, dbChat.agent.voiceChatVoice]
  );

  const session = useMemo(() => {
    if (isEnabled) {
      return new RealtimeSession(agent, {
        model: 'gpt-realtime-2025-08-28'
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

  const setIsMuted = useCallback(
    (next: boolean) => {
      if (!session || session.transport.status !== 'connected') return;
      console.log('🔧 Muting realtime:', next);
      setIsLoading(true);
      session.mute(next);
    },
    [session]
  );

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

      console.log('🔧 New UI messages:', newUIMessages);

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

  useEffect(() => {
    const handleAgentStart = () => {
      setIsAgentTurn(true);

      if (isAutoMuted) {
        setIsMuted(true);
      }
    };

    const handleTransportEvent = (event: TransportEvent) => {
      if (event.type === 'output_audio_buffer.stopped') {
        setIsAgentTurn(false);
        setIsLoading(false);
      }
    };

    const handleInterrupted = () => {
      setIsAgentTurn(false);
      setIsLoading(false);
    };

    session?.on('agent_start', handleAgentStart);
    session?.on('transport_event', handleTransportEvent);
    session?.on('audio_interrupted', handleInterrupted);

    return () => {
      session?.off('agent_start', handleAgentStart);
      session?.off('transport_event', handleTransportEvent);
      session?.off('audio_interrupted', handleInterrupted);
    };
  }, [isAutoMuted, session, setIsMuted]);

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

      setIsLoading(true);

      await session?.connect({
        apiKey: realTimeSessionToken?.value
      });

      const realtimeHistory = convertUIToRealtime(messages);
      session?.updateHistory(realtimeHistory);

      console.log('🔧 Connected to realtime session');

      setMode('realtime');
      setIsMuted(false);
    } catch (error) {
      console.error('❌ Connection failed:', error);
      toast.error(
        `Failed to connect to realtime session: ${(error as Error).message}`
      );
      Sentry.captureException(error);
      setMode('chat');
    } finally {
      setIsLoading(false);
    }
  }, [
    isEnabled,
    messages,
    realTimeSessionToken?.value,
    session,
    setIsMuted,
    setMode
  ]);

  const disconnect = useCallback(async () => {
    try {
      setIsLoading(true);
      session?.close();
      setSyncedMessageIds(new Set());
      setMode('chat');
      setIsMuted(false);
      console.log('🔧 Disconnected from realtime session');
    } catch (error) {
      console.error('❌ Disconnect failed:', error);
      toast.error(
        `Failed to disconnect from realtime session: ${(error as Error).message}`
      );
      Sentry.captureException(error);
    } finally {
      setIsLoading(false);
    }
  }, [session, setIsMuted, setMode]);

  const interrupt = useCallback(() => {
    session?.interrupt();
    setIsAgentTurn(false);
    setIsLoading(false);
  }, [session]);

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
    if (!session || session?.transport.status !== 'connected') {
      return;
    }

    if (mode === 'awaiting-tool-call' && !session?.transport.muted) {
      console.log('🔌 Muting realtime...');
      setIsMuted(true);
      return;
    }

    if (mode === 'chat-finished' && session?.transport.muted) {
      console.log('🔧 Realtime history:', messages);

      const realtimeHistory = convertUIToRealtime(messages);
      session?.updateHistory(realtimeHistory);

      console.log('🔧 Sending message to continue conversation');

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

      console.log('🔧 Unmuting realtime...');
      setIsMuted(false);

      setMode('realtime');
    }
  }, [mode, session?.transport.status, session, messages, setMode, setIsMuted]);

  useEffect(() => {
    console.log('🔧 Session transport status:', session?.transport.status);
    console.log('🔧 Session transport muted:', session?.transport.muted);

    if (session?.transport.status === 'connected') {
      setIsLoading(false);
    }

    if (session?.transport.status === 'disconnected') {
      setIsLoading(false);
    }

    if (session?.transport.status === 'connecting') {
      setIsLoading(true);
    }

    if (session?.transport.status === 'disconnecting') {
      setIsLoading(true);
    }

    if (session?.transport.muted === true) {
      setIsLoading(false);
    }

    if (session?.transport.muted === false) {
      setIsLoading(false);
    }
  }, [session?.transport.status, session?.transport.muted]);

  return (
    <RealTimeContext.Provider
      value={{
        agent,
        session,
        isMuted: session?.transport.muted ?? false,
        setIsMuted,
        connectionState: session?.transport.status ?? 'disconnected',
        connect,
        disconnect,
        canConnect:
          !!realTimeSessionToken?.value && !tokenLoading && !tokenError,
        isLoading,
        isEnabled,
        isAgentTurn,
        interrupt
      }}
    >
      {children}
    </RealTimeContext.Provider>
  );
};

export default RealTimeProvider;
