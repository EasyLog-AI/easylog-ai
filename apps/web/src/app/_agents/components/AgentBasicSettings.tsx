'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SubmitHandler, useFormContext } from 'react-hook-form';
import { toast } from 'sonner';

import Button from '@/app/_ui/components/Button/Button';
import ButtonContent from '@/app/_ui/components/Button/ButtonContent';
import Card from '@/app/_ui/components/Card/Card';
import CardContent from '@/app/_ui/components/Card/CardContent';
import CardFooter from '@/app/_ui/components/Card/CardFooter';
import CardTitle from '@/app/_ui/components/Card/CardTitle';
import FormField from '@/app/_ui/components/FormField/FormField';
import FormFieldContent from '@/app/_ui/components/FormField/FormFieldContent';
import FormFieldError from '@/app/_ui/components/FormField/FormFieldError';
import FormFieldLabel from '@/app/_ui/components/FormField/FormFieldLabel';
import Input from '@/app/_ui/components/Input/Input';
import TextArea from '@/app/_ui/components/TextArea/TextArea';
import useTRPC from '@/lib/trpc/browser';

import useAgentSlug from '../hooks/useAgentSlug';
import { UpdateAgentSchema } from '../schemas/updateAgentSchema';

const AgentBasicSettings = () => {
  const api = useTRPC();
  const agentSlug = useAgentSlug();
  const queryClient = useQueryClient();

  const {
    handleSubmit,
    formState: { isSubmitting, errors },
    register
  } = useFormContext<UpdateAgentSchema>();

  const { mutateAsync: updateAgent } = useMutation(
    api.agents.update.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: api.agents.get.queryKey({ agentId: agentSlug })
        });
        toast.success('Basis instellingen bijgewerkt');
      },
      onError: (error) => {
        toast.error(error.message);
      }
    })
  );

  const onSubmit: SubmitHandler<UpdateAgentSchema> = async (data) => {
    await updateAgent({
      agentId: agentSlug,
      name: data.name,
      prompt: data.prompt,
      autoStartMessage: data.autoStartMessage
    });
  };

  return (
    <Card>
      <CardContent>
        <CardTitle>Basis Instellingen</CardTitle>
        <div className="space-y-4">
          <FormField>
            <FormFieldLabel asChild>
              <label htmlFor="name">Naam</label>
            </FormFieldLabel>
            <FormFieldContent>
              <Input
                id="name"
                size="lg"
                type="text"
                placeholder="Naam"
                autoFocus
                autoComplete="name"
                {...register('name')}
              />
              {errors.name && (
                <FormFieldError>{errors.name.message}</FormFieldError>
              )}
            </FormFieldContent>
          </FormField>

          <FormField>
            <FormFieldLabel asChild>
              <label htmlFor="prompt">Prompt</label>
            </FormFieldLabel>
            <FormFieldContent>
              <TextArea
                asChild
                id="prompt"
                size="lg"
                placeholder="Prompt"
                {...register('prompt')}
              >
                <textarea rows={5} />
              </TextArea>
              {errors.prompt && (
                <FormFieldError>{errors.prompt.message}</FormFieldError>
              )}
            </FormFieldContent>
          </FormField>

          <FormField>
            <FormFieldLabel asChild>
              <label htmlFor="autoStartMessage">Auto Start Bericht</label>
            </FormFieldLabel>
            <FormFieldContent>
              <Input
                id="autoStartMessage"
                size="lg"
                type="text"
                placeholder="[hello]"
                {...register('autoStartMessage')}
              />
              {errors.autoStartMessage && (
                <FormFieldError>
                  {errors.autoStartMessage.message}
                </FormFieldError>
              )}
            </FormFieldContent>
          </FormField>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          type="button"
          colorRole="brand"
          isDisabled={isSubmitting}
          onClick={handleSubmit(onSubmit)}
        >
          <ButtonContent isLoading={isSubmitting}>Opslaan</ButtonContent>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AgentBasicSettings;
