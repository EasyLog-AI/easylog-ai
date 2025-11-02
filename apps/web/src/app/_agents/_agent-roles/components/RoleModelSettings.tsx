'use client';

import { Controller, useFormContext, useWatch } from 'react-hook-form';

import Button from '@/app/_ui/components/Button/Button';
import Card from '@/app/_ui/components/Card/Card';
import CardContent from '@/app/_ui/components/Card/CardContent';
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

import { AgentRoleFormSchema } from '../schemas/agentRoleFormSchema';

const RoleModelSettings = () => {
  const {
    formState: { errors },
    register,
    control
  } = useFormContext<AgentRoleFormSchema>();

  const reasoning = useWatch({
    control,
    name: 'reasoning'
  });

  return (
    <Card>
      <CardContent>
        <CardTitle>Model Instellingen</CardTitle>
        <div className="space-y-4">
          <FormField>
            <FormFieldLabel asChild>
              <label htmlFor="provider">Provider</label>
            </FormFieldLabel>
            <FormFieldContent>
              <Controller
                name="provider"
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
              {errors.provider && (
                <FormFieldError>{errors.provider.message}</FormFieldError>
              )}
            </FormFieldContent>
          </FormField>

          <FormField>
            <FormFieldLabel asChild>
              <label htmlFor="model">Model</label>
            </FormFieldLabel>
            <FormFieldContent>
              <Input
                id="model"
                size="lg"
                type="text"
                placeholder="gpt-5"
                {...register('model')}
              />
              {errors.model && (
                <FormFieldError>{errors.model.message}</FormFieldError>
              )}
            </FormFieldContent>
          </FormField>

          <FormField>
            <FormFieldContent>
              <div className="flex items-center gap-2">
                <Controller
                  name="reasoning"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="reasoning"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <FormFieldLabel asChild>
                  <label htmlFor="reasoning" className="cursor-pointer">
                    Reasoning inschakelen
                  </label>
                </FormFieldLabel>
              </div>
            </FormFieldContent>
          </FormField>

          {reasoning && (
            <FormField>
              <FormFieldLabel asChild>
                <label htmlFor="reasoningEffort">Reasoning Effort</label>
              </FormFieldLabel>
              <FormFieldContent>
                <Controller
                  name="reasoningEffort"
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
                {errors.reasoningEffort && (
                  <FormFieldError>
                    {errors.reasoningEffort.message}
                  </FormFieldError>
                )}
              </FormFieldContent>
            </FormField>
          )}

          <FormField>
            <FormFieldContent>
              <div className="flex items-center gap-2">
                <Controller
                  name="cacheControl"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="cacheControl"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <FormFieldLabel asChild>
                  <label htmlFor="cacheControl" className="cursor-pointer">
                    Cache Control inschakelen
                  </label>
                </FormFieldLabel>
              </div>
            </FormFieldContent>
          </FormField>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleModelSettings;
