'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, SubmitHandler, useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import Button from '@/app/_ui/components/Button/Button';
import ButtonContent from '@/app/_ui/components/Button/ButtonContent';
import Card from '@/app/_ui/components/Card/Card';
import CardContent from '@/app/_ui/components/Card/CardContent';
import CardFooter from '@/app/_ui/components/Card/CardFooter';
import CardTitle from '@/app/_ui/components/Card/CardTitle';
import Checkbox from '@/app/_ui/components/Checkbox/Checkbox';
import FormField from '@/app/_ui/components/FormField/FormField';
import FormFieldContent from '@/app/_ui/components/FormField/FormFieldContent';
import FormFieldError from '@/app/_ui/components/FormField/FormFieldError';
import FormFieldLabel from '@/app/_ui/components/FormField/FormFieldLabel';
import Select from '@/app/_ui/components/Select/Select';
import SelectContent from '@/app/_ui/components/Select/SelectContent';
import SelectItem from '@/app/_ui/components/Select/SelectItem';
import SelectItemContent from '@/app/_ui/components/Select/SelectItemContent';
import SelectTrigger from '@/app/_ui/components/Select/SelectTrigger';
import SelectTriggerContent from '@/app/_ui/components/Select/SelectTriggerContent';
import useTRPC from '@/lib/trpc/browser';

import useAgentSlug from '../hooks/useAgentSlug';
import { UpdateAgentSchema } from '../schemas/updateAgentSchema';

const AgentVoiceChatSettings = () => {
  // eslint-disable-next-line react-compiler/react-compiler
  'use no memo';

  const api = useTRPC();
  const agentSlug = useAgentSlug();
  const queryClient = useQueryClient();

  const {
    handleSubmit,
    formState: { isSubmitting, errors },
    control
  } = useFormContext<UpdateAgentSchema>();

  const voiceChatEnabled = useWatch({
    control,
    name: 'voiceChatEnabled'
  });

  const { mutateAsync: updateAgent } = useMutation(
    api.agents.update.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: api.agents.get.queryKey({ agentId: agentSlug })
        });
        toast.success('Voice chat instellingen bijgewerkt');
      },
      onError: (error) => {
        toast.error(error.message);
      }
    })
  );

  const onSubmit: SubmitHandler<UpdateAgentSchema> = async (data) => {
    await updateAgent({
      agentId: agentSlug,
      voiceChatEnabled: data.voiceChatEnabled,
      voiceChatAutoMute: data.voiceChatAutoMute,
      voiceChatVoice: data.voiceChatVoice
    });
  };

  return (
    <Card>
      <CardContent>
        <CardTitle>Voice Chat Instellingen</CardTitle>
        <div className="space-y-4">
          <FormField>
            <FormFieldContent>
              <div className="flex items-center gap-2">
                <Controller
                  name="voiceChatEnabled"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="voiceChatEnabled"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <FormFieldLabel asChild>
                  <label htmlFor="voiceChatEnabled" className="cursor-pointer">
                    Voice Chat inschakelen
                  </label>
                </FormFieldLabel>
              </div>
            </FormFieldContent>
          </FormField>

          {voiceChatEnabled && (
            <>
              <FormField>
                <FormFieldContent>
                  <div className="flex items-center gap-2">
                    <Controller
                      name="voiceChatAutoMute"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="voiceChatAutoMute"
                          checked={field.value}
                          onCheckedChange={(checked) =>
                            field.onChange(checked === true)
                          }
                        />
                      )}
                    />
                    <FormFieldLabel asChild>
                      <label
                        htmlFor="voiceChatAutoMute"
                        className="cursor-pointer"
                      >
                        Automatisch dempen
                      </label>
                    </FormFieldLabel>
                  </div>
                </FormFieldContent>
              </FormField>

              <FormField>
                <FormFieldLabel asChild>
                  <label htmlFor="voiceChatVoice">Stem</label>
                </FormFieldLabel>
                <FormFieldContent>
                  <Controller
                    name="voiceChatVoice"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger asChild>
                          <Button size="lg" className="w-full">
                            <SelectTriggerContent
                              placeholder="Selecteer een stem"
                              className="font-medium"
                            />
                          </Button>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alloy">
                            <SelectItemContent>Alloy</SelectItemContent>
                          </SelectItem>
                          <SelectItem value="ash">
                            <SelectItemContent>Ash</SelectItemContent>
                          </SelectItem>
                          <SelectItem value="ballad">
                            <SelectItemContent>Ballad</SelectItemContent>
                          </SelectItem>
                          <SelectItem value="cedar">
                            <SelectItemContent>Cedar</SelectItemContent>
                          </SelectItem>
                          <SelectItem value="coral">
                            <SelectItemContent>Coral</SelectItemContent>
                          </SelectItem>
                          <SelectItem value="echo">
                            <SelectItemContent>Echo</SelectItemContent>
                          </SelectItem>
                          <SelectItem value="marin">
                            <SelectItemContent>Marin</SelectItemContent>
                          </SelectItem>
                          <SelectItem value="sage">
                            <SelectItemContent>Sage</SelectItemContent>
                          </SelectItem>
                          <SelectItem value="shimmer">
                            <SelectItemContent>Shimmer</SelectItemContent>
                          </SelectItem>
                          <SelectItem value="verse">
                            <SelectItemContent>Verse</SelectItemContent>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.voiceChatVoice && (
                    <FormFieldError>
                      {errors.voiceChatVoice.message}
                    </FormFieldError>
                  )}
                </FormFieldContent>
              </FormField>
            </>
          )}
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

export default AgentVoiceChatSettings;
