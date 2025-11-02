'use client';

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery
} from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import useAgentSlug from '@/app/_agents/hooks/useAgentSlug';
import Button from '@/app/_ui/components/Button/Button';
import ButtonContent from '@/app/_ui/components/Button/ButtonContent';
import Checkbox from '@/app/_ui/components/Checkbox/Checkbox';
import Dialog from '@/app/_ui/components/Dialog/Dialog';
import DialogBody from '@/app/_ui/components/Dialog/DialogBody';
import DialogContent from '@/app/_ui/components/Dialog/DialogContent';
import DialogFooter from '@/app/_ui/components/Dialog/DialogFooter';
import DialogHeader from '@/app/_ui/components/Dialog/DialogHeader';
import DialogTitle from '@/app/_ui/components/Dialog/DialogTitle';
import FormField from '@/app/_ui/components/FormField/FormField';
import FormFieldContent from '@/app/_ui/components/FormField/FormFieldContent';
import FormFieldLabel from '@/app/_ui/components/FormField/FormFieldLabel';
import Typography from '@/app/_ui/components/Typography/Typography';
import useTRPC from '@/lib/trpc/browser';

export interface DocumentRoleAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: string;
    name: string;
    allRoles: boolean;
    roleIds: string[];
  };
}

const DocumentRoleAccessDialog = ({
  open,
  onOpenChange,
  document
}: DocumentRoleAccessDialogProps) => {
  const api = useTRPC();
  const agentSlug = useAgentSlug();
  const queryClient = useQueryClient();

  const [allRoles, setAllRoles] = useState(document.allRoles);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(
    document.roleIds
  );

  const { data: roles } = useSuspenseQuery(
    api.agents.roles.getMany.queryOptions({
      agentId: agentSlug
    })
  );

  const { mutateAsync: updateRoleAccess, isPending } = useMutation(
    api.documents.updateRoleAccess.mutationOptions({
      onSuccess: () => {
        toast.success('Toegang bijgewerkt');
        void queryClient.invalidateQueries({
          queryKey: api.documents.getMany.queryKey({
            cursor: 0,
            limit: 100,
            filter: {
              agentId: agentSlug
            }
          })
        });
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error.message);
      }
    })
  );

  const handleSave = async () => {
    await updateRoleAccess({
      documentId: document.id,
      allRoles,
      roleIds: allRoles ? [] : selectedRoleIds
    });
  };

  const handleRoleToggle = (roleId: string, checked: boolean) => {
    if (checked) {
      setSelectedRoleIds((prev) => [...prev, roleId]);
    } else {
      setSelectedRoleIds((prev) => prev.filter((id) => id !== roleId));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Toegang beheren</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <Typography variant="bodySm" className="text-text-muted">
              Beheer welke rollen toegang hebben tot &quot;{document.name}&quot;
            </Typography>

            {/* All Roles Checkbox */}
            <FormField>
              <FormFieldContent>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="allRoles"
                    checked={allRoles}
                    onCheckedChange={(checked) => setAllRoles(checked === true)}
                  />
                  <FormFieldLabel asChild>
                    <label htmlFor="allRoles" className="cursor-pointer">
                      Alle rollen hebben toegang
                    </label>
                  </FormFieldLabel>
                </div>
              </FormFieldContent>
            </FormField>

            {/* Specific Roles */}
            {!allRoles && (
              <div className="space-y-2">
                <Typography variant="bodySm" className="font-medium">
                  Selecteer specifieke rollen:
                </Typography>
                {roles.length === 0 ? (
                  <Typography variant="bodySm" className="text-text-muted">
                    Geen rollen beschikbaar. Maak eerst rollen aan.
                  </Typography>
                ) : (
                  <div className="border-border-primary space-y-2 rounded-lg border p-4">
                    {roles.map((role) => (
                      <FormField key={role.id}>
                        <FormFieldContent>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={role.id}
                              checked={selectedRoleIds.includes(role.id)}
                              onCheckedChange={(checked) =>
                                handleRoleToggle(role.id, checked === true)
                              }
                            />
                            <FormFieldLabel asChild>
                              <label
                                htmlFor={role.id}
                                className="cursor-pointer"
                              >
                                <Typography variant="bodySm">
                                  {role.name}
                                </Typography>
                                {role.description && (
                                  <Typography
                                    variant="bodySm"
                                    className="text-text-muted"
                                  >
                                    {role.description}
                                  </Typography>
                                )}
                              </label>
                            </FormFieldLabel>
                          </div>
                        </FormFieldContent>
                      </FormField>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            <ButtonContent>Annuleren</ButtonContent>
          </Button>
          <Button
            colorRole="brand"
            isDisabled={
              isPending || (!allRoles && selectedRoleIds.length === 0)
            }
            onClick={handleSave}
          >
            <ButtonContent isLoading={isPending}>Opslaan</ButtonContent>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentRoleAccessDialog;
