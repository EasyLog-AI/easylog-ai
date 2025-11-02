'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Controller,
  SubmitHandler,
  useFormContext,
  useWatch
} from 'react-hook-form';
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
import Input from '@/app/_ui/components/Input/Input';
import Select from '@/app/_ui/components/Select/Select';
import SelectContent from '@/app/_ui/components/Select/SelectContent';
import SelectItem from '@/app/_ui/components/Select/SelectItem';
import SelectItemContent from '@/app/_ui/components/Select/SelectItemContent';
import SelectTrigger from '@/app/_ui/components/Select/SelectTrigger';
import SelectTriggerContent from '@/app/_ui/components/Select/SelectTriggerContent';
import useTRPC from '@/lib/trpc/browser';

import useAgentSlug from '../hooks/useAgentSlug';
import { UpdateAgentSchema } from '../schemas/updateAgentSchema';

const AgentModelSettings = () => {
  // eslint-disable-next-line react-compiler/react-compiler
  'use no memo';

  const api = useTRPC();
  const agentSlug = useAgentSlug();
  const queryClient = useQueryClient();

  const {
    handleSubmit,
    formState: { isSubmitting, errors },
    register,
    control
  } = useFormContext<UpdateAgentSchema>();

  const defaultReasoning = useWatch({
    control,
    name: 'defaultReasoning'
  });

  const { mutateAsync: updateAgent } = useMutation(
    api.agents.update.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: api.agents.get.queryKey({ agentId: agentSlug })
        });
        toast.success('Model instellingen bijgewerkt');
      },
      onError: (error) => {
        toast.error(error.message);
      }
    })
  );

  const onSubmit: SubmitHandler<UpdateAgentSchema> = async (data) => {
    await updateAgent({
      agentId: agentSlug,
      defaultProvider: data.defaultProvider,
      defaultModel: data.defaultModel,
      defaultReasoning: data.defaultReasoning,
      defaultReasoningEffort: data.defaultReasoningEffort,
      defaultCacheControl: data.defaultCacheControl
    });
  };

  return (
    <Card>
      <CardContent>
        <CardTitle>Model Instellingen</CardTitle>
        <div className="space-y-4">
          <FormField>
            <FormFieldLabel asChild>
              <label htmlFor="defaultProvider">Provider</label>
            </FormFieldLabel>
            <FormFieldContent>
              <Controller
                name="defaultProvider"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger asChild>
                      <Button size="lg" className="w-full">
                        <SelectTriggerContent
                          placeholder="Selecteer een provider"
                          className="font-medium"
                        />
                      </Button>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openrouter">
                        <SelectItemContent>OpenRouter</SelectItemContent>
                      </SelectItem>
                      <SelectItem value="anthropic">
                        <SelectItemContent>Anthropic</SelectItemContent>
                      </SelectItem>
                      <SelectItem value="amazon-bedrock">
                        <SelectItemContent>Amazon Bedrock</SelectItemContent>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.defaultProvider && (
                <FormFieldError>
                  {errors.defaultProvider.message}
                </FormFieldError>
              )}
            </FormFieldContent>
          </FormField>

          <FormField>
            <FormFieldLabel asChild>
              <label htmlFor="defaultModel">Model</label>
            </FormFieldLabel>
            <FormFieldContent>
              <Input
                id="defaultModel"
                size="lg"
                type="text"
                placeholder="gpt-5"
                {...register('defaultModel')}
              />
              {errors.defaultModel && (
                <FormFieldError>{errors.defaultModel.message}</FormFieldError>
              )}
            </FormFieldContent>
          </FormField>

          <FormField>
            <FormFieldContent>
              <div className="flex items-center gap-2">
                <Controller
                  name="defaultReasoning"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="defaultReasoning"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <FormFieldLabel asChild>
                  <label htmlFor="defaultReasoning" className="cursor-pointer">
                    Reasoning inschakelen
                  </label>
                </FormFieldLabel>
              </div>
            </FormFieldContent>
          </FormField>

          {defaultReasoning && (
            <FormField>
              <FormFieldLabel asChild>
                <label htmlFor="defaultReasoningEffort">Reasoning Effort</label>
              </FormFieldLabel>
              <FormFieldContent>
                <Controller
                  name="defaultReasoningEffort"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger asChild>
                        <Button size="lg" className="w-full">
                          <SelectTriggerContent
                            placeholder="Selecteer effort"
                            className="font-medium"
                          />
                        </Button>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          <SelectItemContent>Laag</SelectItemContent>
                        </SelectItem>
                        <SelectItem value="medium">
                          <SelectItemContent>Gemiddeld</SelectItemContent>
                        </SelectItem>
                        <SelectItem value="high">
                          <SelectItemContent>Hoog</SelectItemContent>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.defaultReasoningEffort && (
                  <FormFieldError>
                    {errors.defaultReasoningEffort.message}
                  </FormFieldError>
                )}
              </FormFieldContent>
            </FormField>
          )}

          <FormField>
            <FormFieldContent>
              <div className="flex items-center gap-2">
                <Controller
                  name="defaultCacheControl"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="defaultCacheControl"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <FormFieldLabel asChild>
                  <label
                    htmlFor="defaultCacheControl"
                    className="cursor-pointer"
                  >
                    Cache Control inschakelen
                  </label>
                </FormFieldLabel>
              </div>
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

export default AgentModelSettings;
