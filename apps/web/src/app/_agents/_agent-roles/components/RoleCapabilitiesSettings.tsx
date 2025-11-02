'use client';

import { Controller, useFormContext } from 'react-hook-form';

import Card from '@/app/_ui/components/Card/Card';
import CardContent from '@/app/_ui/components/Card/CardContent';
import CardTitle from '@/app/_ui/components/Card/CardTitle';
import Checkbox from '@/app/_ui/components/Checkbox/Checkbox';
import FormField from '@/app/_ui/components/FormField/FormField';
import FormFieldContent from '@/app/_ui/components/FormField/FormFieldContent';
import FormFieldLabel from '@/app/_ui/components/FormField/FormFieldLabel';

import { AgentRoleFormSchema } from '../schemas/agentRoleFormSchema';

const RoleCapabilitiesSettings = () => {
  const { control } = useFormContext<AgentRoleFormSchema>();

  return (
    <Card>
      <CardContent>
        <CardTitle>Mogelijkheden</CardTitle>
        <div className="grid grid-cols-2 gap-4">
          <FormField>
            <FormFieldContent>
              <div className="flex items-center gap-2">
                <Controller
                  name="capabilities.core"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="core"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <FormFieldLabel asChild>
                  <label htmlFor="core" className="cursor-pointer">
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
                  name="capabilities.charts"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="charts"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <FormFieldLabel asChild>
                  <label htmlFor="charts" className="cursor-pointer">
                    Charts
                  </label>
                </FormFieldLabel>
              </div>
            </FormFieldContent>
          </FormField>

          <FormField>
            <FormFieldContent>
              <div className="flex items-center gap-2">
                <Controller
                  name="capabilities.planning"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="planning"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <FormFieldLabel asChild>
                  <label htmlFor="planning" className="cursor-pointer">
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
                  name="capabilities.sql"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="sql"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <FormFieldLabel asChild>
                  <label htmlFor="sql" className="cursor-pointer">
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
                  name="capabilities.knowledgeBase"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="knowledgeBase"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <FormFieldLabel asChild>
                  <label htmlFor="knowledgeBase" className="cursor-pointer">
                    Knowledge Base
                  </label>
                </FormFieldLabel>
              </div>
            </FormFieldContent>
          </FormField>

          <FormField>
            <FormFieldContent>
              <div className="flex items-center gap-2">
                <Controller
                  name="capabilities.loadDocument"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="loadDocument"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <FormFieldLabel asChild>
                  <label htmlFor="loadDocument" className="cursor-pointer">
                    Load Document
                  </label>
                </FormFieldLabel>
              </div>
            </FormFieldContent>
          </FormField>

          <FormField>
            <FormFieldContent>
              <div className="flex items-center gap-2">
                <Controller
                  name="capabilities.memories"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="memories"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <FormFieldLabel asChild>
                  <label htmlFor="memories" className="cursor-pointer">
                    Memories
                  </label>
                </FormFieldLabel>
              </div>
            </FormFieldContent>
          </FormField>

          <FormField>
            <FormFieldContent>
              <div className="flex items-center gap-2">
                <Controller
                  name="capabilities.multipleChoice"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="multipleChoice"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <FormFieldLabel asChild>
                  <label htmlFor="multipleChoice" className="cursor-pointer">
                    Multiple Choice
                  </label>
                </FormFieldLabel>
              </div>
            </FormFieldContent>
          </FormField>

          <FormField>
            <FormFieldContent>
              <div className="flex items-center gap-2">
                <Controller
                  name="capabilities.pqiAudits"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="pqiAudits"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <FormFieldLabel asChild>
                  <label htmlFor="pqiAudits" className="cursor-pointer">
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
                  name="capabilities.followUps"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="followUps"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <FormFieldLabel asChild>
                  <label htmlFor="followUps" className="cursor-pointer">
                    Follow Ups
                  </label>
                </FormFieldLabel>
              </div>
            </FormFieldContent>
          </FormField>

          <FormField>
            <FormFieldContent>
              <div className="flex items-center gap-2">
                <Controller
                  name="capabilities.submissions"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="submissions"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  )}
                />
                <FormFieldLabel asChild>
                  <label htmlFor="submissions" className="cursor-pointer">
                    Submissions
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

export default RoleCapabilitiesSettings;
