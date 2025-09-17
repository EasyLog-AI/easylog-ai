import { useContext } from 'react';

import { ChatModeContext } from '../components/ChatModeProvider';

const useChatMode = () => {
  const context = useContext(ChatModeContext);
  if (context === undefined) {
    throw new Error('useChatMode must be used within a ChatModeProvider');
  }
  return context;
};

export default useChatMode;