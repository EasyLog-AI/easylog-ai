'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { FormProvider } from 'react-hook-form';

import useZodForm from '@/app/_ui/hooks/useZodForm';
import useTRPC from '@/lib/trpc/browser';

import AgentBasicSettings from './AgentBasicSettings';
import AgentCapabilitiesSettings from './AgentCapabilitiesSettings';
import AgentModelSettings from './AgentModelSettings';
import AgentVoiceChatSettings from './AgentVoiceChatSettings';
import useAgentSlug from '../hooks/useAgentSlug';
import updateAgentSchema from '../schemas/updateAgentSchema';

const AgentBaseSettingsForm = () => {
  const api = useTRPC();
  const agentSlug = useAgentSlug();

  const { data: agent } = useSuspenseQuery(
    api.agents.get.queryOptions({
      agentId: agentSlug
    })
  );

  const methods = useZodForm(updateAgentSchema, {
    mode: 'onChange',
    defaultValues: {
      name: agent?.name,
      prompt: agent?.prompt,
      defaultModel: agent?.defaultModel,
      defaultProvider: agent?.defaultProvider,
      defaultReasoning: agent?.defaultReasoning,
      defaultReasoningEffort: agent?.defaultReasoningEffort,
      defaultCacheControl: agent?.defaultCacheControl,
      autoStartMessage: agent?.autoStartMessage,
      voiceChatEnabled: agent?.voiceChatEnabled,
      voiceChatAutoMute: agent?.voiceChatAutoMute,
      voiceChatVoice: agent?.voiceChatVoice,
      defaultCapabilities: agent?.defaultCapabilities
    }
  });

  return (
    <FormProvider {...methods}>
      <div className="space-y-6">
        <AgentBasicSettings />
        <AgentModelSettings />
        <AgentVoiceChatSettings />
        <AgentCapabilitiesSettings />
      </div>
    </FormProvider>
  );
};

export default AgentBaseSettingsForm;
