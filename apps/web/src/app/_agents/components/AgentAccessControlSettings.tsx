'use client';

import { IconX } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
import FormFieldLabel from '@/app/_ui/components/FormField/FormFieldLabel';
import Icon from '@/app/_ui/components/Icon/Icon';
import Input from '@/app/_ui/components/Input/Input';
import Typography from '@/app/_ui/components/Typography/Typography';
import authBrowserClient from '@/lib/better-auth/browser';
import useTRPC from '@/lib/trpc/browser';

import useAgentSlug from '../hooks/useAgentSlug';
import { UpdateAgentSchema } from '../schemas/updateAgentSchema';

const AgentAccessControlSettings = () => {
  // eslint-disable-next-line react-compiler/react-compiler
  'use no memo';

  const api = useTRPC();
  const agentSlug = useAgentSlug();
  const queryClient = useQueryClient();
  const [newDomain, setNewDomain] = useState('');

  const {
    handleSubmit,
    formState: { isSubmitting },
    watch,
    setValue
  } = useFormContext<UpdateAgentSchema>();

  const allowedDomains = watch('allowedDomains') || [];

  const { mutateAsync: updateAgent } = useMutation(
    api.agents.update.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: api.agents.get.queryKey({ agentId: agentSlug })
        });
        toast.success('Toegangscontrole instellingen bijgewerkt');
      },
      onError: (error) => {
        toast.error(error.message);
      }
    })
  );

  const onSubmit: SubmitHandler<UpdateAgentSchema> = async (data) => {
    await updateAgent({
      agentId: agentSlug,
      allowedDomains: data.allowedDomains
    });
  };

  const addDomain = () => {
    if (!newDomain.trim()) return;

    const domain = newDomain.trim().toLowerCase();
    if (allowedDomains.includes(domain)) {
      toast.error('Dit domein is al toegevoegd');
      return;
    }

    setValue('allowedDomains', [...allowedDomains, domain], {
      shouldDirty: true
    });
    setNewDomain('');
  };

  const { data: session } = authBrowserClient.useSession();

  /**
   * Removes a domain from the allowed domains list. If removing "*" would
   * result in an empty list, automatically adds the current user's domain.
   *
   * @param domain - The domain to remove
   */
  const removeDomain = (domain: string) => {
    console.log('removeDomain called', {
      domain,
      currentDomains: allowedDomains,
      sessionEmail: session?.user?.email
    });

    let filteredDomains = allowedDomains.filter((d) => d !== domain);
    const isRemovingWildcard = domain === '*';
    const wouldBeEmpty = filteredDomains.length === 0;
    const userEmail = session?.user?.email;

    console.log('removeDomain logic', {
      filteredDomains,
      isRemovingWildcard,
      wouldBeEmpty,
      userEmail
    });

    if (isRemovingWildcard && wouldBeEmpty && userEmail) {
      const userDomain = userEmail.split('@')[1];
      if (userDomain) {
        filteredDomains = [...filteredDomains, userDomain];
        console.log('Added user domain', { userDomain, filteredDomains });
        toast.info(
          `Je domein (${userDomain}) is automatisch toegevoegd om lockout te voorkomen`
        );
      }
    }

    console.log('Setting value', { filteredDomains });
    setValue('allowedDomains', filteredDomains, { shouldDirty: true });
  };

  const isAllAccess = allowedDomains.includes('*');

  return (
    <Card>
      <CardContent>
        <CardTitle>Toegangscontrole</CardTitle>
        <Typography variant="bodySm" className="text-text-muted mb-4">
          Bepaal welke gebruikers toegang hebben tot deze agent op basis van hun
          e-maildomein. Gebruik &quot;*&quot; om iedereen toegang te geven.
        </Typography>

        <div className="space-y-4">
          <FormField>
            <FormFieldLabel asChild>
              <label htmlFor="newDomain">Domein toevoegen</label>
            </FormFieldLabel>
            <FormFieldContent>
              <div className="flex gap-2">
                <Input
                  id="newDomain"
                  type="text"
                  className="min-w-64"
                  placeholder="bijv. easylog.nu of * voor iedereen"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addDomain();
                    }
                  }}
                />
                <Button
                  type="button"
                  colorRole="brand"
                  onClick={addDomain}
                  isDisabled={!newDomain.trim()}
                >
                  Toevoegen
                </Button>
              </div>
            </FormFieldContent>
          </FormField>

          {allowedDomains.length > 0 && (
            <div className="space-y-2">
              <Typography variant="bodySm" className="text-text-muted">
                Toegestane domeinen:
              </Typography>
              <div className="flex flex-wrap gap-2">
                {allowedDomains.map((domain) => (
                  <div
                    key={domain}
                    className="bg-fill-muted border-border-primary flex items-center gap-2 rounded-lg border px-3 py-1"
                  >
                    <Typography
                      variant="bodySm"
                      className="text-text-primary font-medium"
                    >
                      {domain}
                      {domain === '*' && ' (iedereen)'}
                    </Typography>
                    <Button
                      type="button"
                      onClick={() => removeDomain(domain)}
                      size="sm"
                      variant="ghost"
                      shape="circle"
                    >
                      <ButtonContent>
                        <Icon icon={IconX} colorRole="muted" />
                      </ButtonContent>
                    </Button>
                  </div>
                ))}
              </div>
              {isAllAccess && (
                <Typography variant="bodySm" className="text-text-muted italic">
                  Let op: Met &quot;*&quot; hebben alle gebruikers toegang tot
                  deze agent, ongeacht hun e-maildomein.
                </Typography>
              )}
            </div>
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

export default AgentAccessControlSettings;
