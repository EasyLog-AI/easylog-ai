import { useContext } from 'react';

import { TRPCContext } from '../providers/TRPCReactProvider';

const useTRPCContext = () => {
  const context = useContext(TRPCContext);

  if (context === undefined) {
    throw new Error('useTRPCContext must be used within a TRPCReactProvider');
  }

  return context;
};

export default useTRPCContext;