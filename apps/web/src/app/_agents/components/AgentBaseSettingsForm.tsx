'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { FormProvider } from 'react-hook-form';

import Typography from '@/app/_ui/components/Typography/Typography';
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
        <div className="bg-fill-muted border-border-primary rounded-lg border p-4">
          <Typography variant="bodySm" className="text-text-primary font-medium">
            Standaard Agent Instellingen
          </Typography>
          <Typography variant="bodySm" className="text-text-muted mt-1">
            Deze instellingen zijn de standaard voor de agent. Ze kunnen worden
            overschreven door rol-specifieke instellingen wanneer een gebruiker
            een bepaalde rol heeft.
          </Typography>
        </div>
        <AgentBasicSettings />
        <AgentModelSettings />
        <AgentVoiceChatSettings />
        <AgentCapabilitiesSettings />
      </div>
    </FormProvider>
  );
};

export default AgentBaseSettingsForm;
