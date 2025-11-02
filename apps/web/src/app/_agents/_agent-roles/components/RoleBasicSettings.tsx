'use client';

import { Controller, useFormContext } from 'react-hook-form';

import Card from '@/app/_ui/components/Card/Card';
import CardContent from '@/app/_ui/components/Card/CardContent';
import CardTitle from '@/app/_ui/components/Card/CardTitle';
import Checkbox from '@/app/_ui/components/Checkbox/Checkbox';
import FormField from '@/app/_ui/components/FormField/FormField';
import FormFieldContent from '@/app/_ui/components/FormField/FormFieldContent';
import FormFieldError from '@/app/_ui/components/FormField/FormFieldError';
import FormFieldLabel from '@/app/_ui/components/FormField/FormFieldLabel';
import Input from '@/app/_ui/components/Input/Input';
import TextArea from '@/app/_ui/components/TextArea/TextArea';

import { AgentRoleFormSchema } from '../schemas/agentRoleFormSchema';

const RoleBasicSettings = () => {
  const {
    formState: { errors },
    register,
    control
  } = useFormContext<AgentRoleFormSchema>();

  return (
    <Card>
      <CardContent>
        <CardTitle>Basis Instellingen</CardTitle>
        <div className="space-y-4">
          <FormField>
            <FormFieldContent>
              <div className="flex items-center gap-2">
                <Controller
                  name="isDefault"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="isDefault"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <FormFieldLabel asChild>
                  <label htmlFor="isDefault" className="cursor-pointer">
                    Standaard rol
                  </label>
                </FormFieldLabel>
              </div>
            </FormFieldContent>
          </FormField>

          <FormField>
            <FormFieldLabel asChild>
              <label htmlFor="name">Naam</label>
            </FormFieldLabel>
            <FormFieldContent>
              <Input
                id="name"
                size="lg"
                type="text"
                placeholder="Klantenservice"
                {...register('name')}
              />
              {errors.name && (
                <FormFieldError>{errors.name.message}</FormFieldError>
              )}
            </FormFieldContent>
          </FormField>

          <FormField>
            <FormFieldLabel asChild>
              <label htmlFor="description">Beschrijving</label>
            </FormFieldLabel>
            <FormFieldContent>
              <TextArea
                asChild
                id="description"
                size="lg"
                placeholder="Een beschrijving van deze rol"
                {...register('description')}
              >
                <textarea rows={3} />
              </TextArea>
              {errors.description && (
                <FormFieldError>{errors.description.message}</FormFieldError>
              )}
            </FormFieldContent>
          </FormField>

          <FormField>
            <FormFieldLabel asChild>
              <label htmlFor="instructions">Instructies</label>
            </FormFieldLabel>
            <FormFieldContent>
              <TextArea
                asChild
                id="instructions"
                size="lg"
                placeholder="You are a helpful assistant..."
                {...register('instructions')}
              >
                <textarea rows={5} />
              </TextArea>
              {errors.instructions && (
                <FormFieldError>{errors.instructions.message}</FormFieldError>
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
    </Card>
  );
};

export default RoleBasicSettings;
