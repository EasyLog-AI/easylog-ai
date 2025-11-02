'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, SubmitHandler, useFormContext } from 'react-hook-form';
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
import FormFieldLabel from '@/app/_ui/components/FormField/FormFieldLabel';
import useTRPC from '@/lib/trpc/browser';

import useAgentSlug from '../hooks/useAgentSlug';
import { UpdateAgentSchema } from '../schemas/updateAgentSchema';

const AgentCapabilitiesSettings = () => {
  const api = useTRPC();
  const agentSlug = useAgentSlug();
  const queryClient = useQueryClient();

  const {
    handleSubmit,
    formState: { isSubmitting },
    control
  } = useFormContext<UpdateAgentSchema>();

  const { mutateAsync: updateAgent } = useMutation(
    api.agents.update.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: api.agents.get.queryKey({ agentId: agentSlug })
        });
        toast.success('Mogelijkheden bijgewerkt');
      },
      onError: (error) => {
        toast.error(error.message);
      }
    })
  );

  const onSubmit: SubmitHandler<UpdateAgentSchema> = async (data) => {
    await updateAgent({
      agentId: agentSlug,
      defaultCapabilities: data.defaultCapabilities
    });
  };

  return (
    <Card>
      <CardContent>
        <CardTitle>Mogelijkheden</CardTitle>
        <div className="space-y-3">
          <FormField>
            <FormFieldContent>
              <div className="flex items-center gap-2">
                <Controller
                  name="defaultCapabilities.core"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="capability-core"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <FormFieldLabel asChild>
                  <label htmlFor="capability-core" className="cursor-pointer">
                    Core
                  </label>
                </FormFieldLabel>
              </div>
            </FormFieldContent>
          </FormField>

          <FormField>
            <FormFieldContent>
              <div className="flex items-center gap-2">
                <Controller
                  name="defaultCapabilities.charts"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="capability-charts"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <FormFieldLabel asChild>
                  <label htmlFor="capability-charts" className="cursor-pointer">
                    Grafieken
                  </label>
                </FormFieldLabel>
              </div>
            </FormFieldContent>
          </FormField>

          <FormField>
            <FormFieldContent>
              <div className="flex items-center gap-2">
                <Controller
                  name="defaultCapabilities.planning"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="capability-planning"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <FormFieldLabel asChild>
                  <label
                    htmlFor="capability-planning"
                    className="cursor-pointer"
                  >
                    Planning
                  </label>
                </FormFieldLabel>
              </div>
            </FormFieldContent>
          </FormField>

          <FormField>
            <FormFieldContent>
              <div className="flex items-center gap-2">
                <Controller
                  name="defaultCapabilities.sql"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="capability-sql"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <FormFieldLabel asChild>
                  <label htmlFor="capability-sql" className="cursor-pointer">
                    SQL
                  </label>
                </FormFieldLabel>
              </div>
            </FormFieldContent>
          </FormField>

          <FormField>
            <FormFieldContent>
              <div className="flex items-center gap-2">
                <Controller
                  name="defaultCapabilities.knowledgeBase"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="capability-knowledgeBase"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <FormFieldLabel asChild>
                  <label
                    htmlFor="capability-knowledgeBase"
                    className="cursor-pointer"
                  >
                    Kennisbank
                  </label>
                </FormFieldLabel>
              </div>
            </FormFieldContent>
          </FormField>

          <FormField>
            <FormFieldContent>
              <div className="flex items-center gap-2">
                <Controller
                  name="defaultCapabilities.loadDocument"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="capability-loadDocument"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <FormFieldLabel asChild>
                  <label
                    htmlFor="capability-loadDocument"
                    className="cursor-pointer"
                  >
                    Documenten Laden
                  </label>
                </FormFieldLabel>
              </div>
            </FormFieldContent>
          </FormField>

          <FormField>
            <FormFieldContent>
              <div className="flex items-center gap-2">
                <Controller
                  name="defaultCapabilities.memories"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="capability-memories"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <FormFieldLabel asChild>
                  <label
                    htmlFor="capability-memories"
                    className="cursor-pointer"
                  >
                    Herinneringen
                  </label>
                </FormFieldLabel>
              </div>
            </FormFieldContent>
          </FormField>

          <FormField>
            <FormFieldContent>
              <div className="flex items-center gap-2">
                <Controller
                  name="defaultCapabilities.multipleChoice"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="capability-multipleChoice"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <FormFieldLabel asChild>
                  <label
                    htmlFor="capability-multipleChoice"
                    className="cursor-pointer"
                  >
                    Meerkeuze
                  </label>
                </FormFieldLabel>
              </div>
            </FormFieldContent>
          </FormField>

          <FormField>
            <FormFieldContent>
              <div className="flex items-center gap-2">
                <Controller
                  name="defaultCapabilities.pqiAudits"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="capability-pqiAudits"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <FormFieldLabel asChild>
                  <label
                    htmlFor="capability-pqiAudits"
                    className="cursor-pointer"
                  >
                    PQI Audits
                  </label>
                </FormFieldLabel>
              </div>
            </FormFieldContent>
          </FormField>

          <FormField>
            <FormFieldContent>
              <div className="flex items-center gap-2">
                <Controller
                  name="defaultCapabilities.followUps"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="capability-followUps"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <FormFieldLabel asChild>
                  <label
                    htmlFor="capability-followUps"
                    className="cursor-pointer"
                  >
                    Follow-ups
                  </label>
                </FormFieldLabel>
              </div>
            </FormFieldContent>
          </FormField>

          <FormField>
            <FormFieldContent>
              <div className="flex items-center gap-2">
                <Controller
                  name="defaultCapabilities.submissions"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="capability-submissions"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <FormFieldLabel asChild>
                  <label
                    htmlFor="capability-submissions"
                    className="cursor-pointer"
                  >
                    Inzendingen
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

export default AgentCapabilitiesSettings;
