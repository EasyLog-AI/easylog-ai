import { useParams } from 'next/navigation';
import { z } from 'zod';

const useAgentSlug = <T extends boolean = true>(throwOnInvalid?: T) => {
  const params = useParams();

  const result = z
    .object({
      agentSlug: z.string()
    })
    .safeParse(params);

  if (!result.success && throwOnInvalid) {
    throw new Error('Invalid params');
  }

  const agentSlug = result.data?.agentSlug ?? null;

  return agentSlug as T extends true ? string : string | null;
};

export default useAgentSlug;
