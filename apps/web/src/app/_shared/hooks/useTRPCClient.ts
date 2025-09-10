import useTRPCContext from './useTRPCContext';

/**
 * Hook to access the raw TRPC client for advanced use cases
 * For most use cases, use the regular useTRPC() hook instead
 */
const useTRPCClient = () => {
  const { trpcClient } = useTRPCContext();
  return trpcClient;
};

export default useTRPCClient;