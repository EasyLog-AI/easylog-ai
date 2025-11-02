'use client';

import { IconCheck, IconX } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormProvider, SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import Button from '@/app/_ui/components/Button/Button';
import ButtonContent from '@/app/_ui/components/Button/ButtonContent';
import useZodForm from '@/app/_ui/hooks/useZodForm';
import useTRPC from '@/lib/trpc/browser';

import RoleBasicSettings from './RoleBasicSettings';
import RoleCapabilitiesSettings from './RoleCapabilitiesSettings';
import RoleModelSettings from './RoleModelSettings';
import useAgentSlug from '../../hooks/useAgentSlug';
import agentRoleFormSchema, {
  AgentRoleFormSchema
} from '../schemas/agentRoleFormSchema';

interface AgentRoleFormProps {
  role?: {
    id: string;
    name: string;
    description: string;
    instructions: string;
    model: string;
    provider: 'openrouter' | 'anthropic' | 'amazon-bedrock';
    reasoning: boolean;
    reasoningEffort: 'high' | 'medium' | 'low';
    cacheControl: boolean;
    autoStartMessage: string | null;
    capabilities: Record<string, boolean>;
  };
  onCancel: () => void;
  onSuccess: () => void;
}

const AgentRoleForm = ({ role, onCancel, onSuccess }: AgentRoleFormProps) => {
  const api = useTRPC();
  const agentSlug = useAgentSlug();
  const queryClient = useQueryClient();

  const methods = useZodForm(agentRoleFormSchema, {
    mode: 'onChange',
    defaultValues: role || {
      name: '',
      description: '',
      instructions: 'You are a helpful assistant.',
      model: 'gpt-5',
      provider: 'openrouter',
      reasoning: false,
      reasoningEffort: 'medium',
      cacheControl: false,
      autoStartMessage: null,
      capabilities: {
        core: true,
        charts: true,
        planning: true,
        sql: true,
        knowledgeBase: true,
        loadDocument: false,
        memories: true,
        multipleChoice: true,
        pqiAudits: true,
        followUps: false,
        submissions: false
      }
    }
  });

  const { mutateAsync: createRole, isPending: isCreating } = useMutation(
    api.agents.roles.create.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: api.agents.roles.getMany.queryKey({ agentId: agentSlug })
        });
        toast.success('Rol aangemaakt');
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.message);
      }
    })
  );

  const { mutateAsync: updateRole, isPending: isUpdating } = useMutation(
    api.agents.roles.update.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: api.agents.roles.getMany.queryKey({ agentId: agentSlug })
        });
        toast.success('Rol bijgewerkt');
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.message);
      }
    })
  );

  const onSubmit: SubmitHandler<AgentRoleFormSchema> = async (data) => {
    if (role) {
      await updateRole({
        agentId: agentSlug,
        roleId: role.id,
        data
      });
    } else {
      await createRole({
        agentId: agentSlug,
        ...data
      });
    }
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <RoleBasicSettings />
        <RoleModelSettings />
        <RoleCapabilitiesSettings />

        <div className="flex gap-2">
          <Button type="submit" colorRole="brand" isDisabled={isSubmitting}>
            <ButtonContent isLoading={isSubmitting} iconLeft={IconCheck}>
              {role ? 'Bijwerken' : 'Aanmaken'}
            </ButtonContent>
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            <ButtonContent iconLeft={IconX}>Annuleren</ButtonContent>
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default AgentRoleForm;
