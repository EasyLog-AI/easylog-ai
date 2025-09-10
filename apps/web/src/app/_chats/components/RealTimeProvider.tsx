'use client';

import { RealtimeAgent, RealtimeSession } from '@openai/agents-realtime';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';

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

  useEffect(() => {
    session.history.forEach((item) => {
      console.log(item);
    });
  }, [session.history]);

  const connect = useCallback(async () => {
    await session.connect({
      apiKey: 'ek_68c14cf41c2c81919bf250988597835b'
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
