'use client';

import { createContext, useState } from 'react';

export type ChatMode =
  | 'chat'
  | 'awaiting-tool-call'
  | 'chat-finished'
  | 'realtime';

interface ChatModeContextType {
  mode: ChatMode;
  setMode: (mode: ChatMode) => void;
}

export const ChatModeContext = createContext<ChatModeContextType | undefined>(
  undefined
);

interface ChatModeProviderProps {
  initialMode?: ChatMode;
}

const ChatModeProvider = ({
  children,
  initialMode = 'chat'
}: React.PropsWithChildren<ChatModeProviderProps>) => {
  const [mode, setMode] = useState<ChatMode>(initialMode);

  return (
    <ChatModeContext.Provider
      value={{
        mode,
        setMode: (newMode) => {
          console.log(`🔄 Mode change: ${mode} → ${newMode}`);
          return setMode(newMode);
        }
      }}
    >
      {children}
    </ChatModeContext.Provider>
  );
};

export default ChatModeProvider;
