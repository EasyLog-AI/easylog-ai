'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import AlertDialog from '@/app/_ui/components/AlertDialog/AlertDialog';
import AlertDialogAction from '@/app/_ui/components/AlertDialog/AlertDialogAction';
import AlertDialogBody from '@/app/_ui/components/AlertDialog/AlertDialogBody';
import AlertDialogCancel from '@/app/_ui/components/AlertDialog/AlertDialogCancel';
import AlertDialogContent from '@/app/_ui/components/AlertDialog/AlertDialogContent';
import AlertDialogDescription from '@/app/_ui/components/AlertDialog/AlertDialogDescription';
import AlertDialogFooter from '@/app/_ui/components/AlertDialog/AlertDialogFooter';
import AlertDialogHeader from '@/app/_ui/components/AlertDialog/AlertDialogHeader';
import AlertDialogTitle from '@/app/_ui/components/AlertDialog/AlertDialogTitle';
import Button from '@/app/_ui/components/Button/Button';
import ButtonContent from '@/app/_ui/components/Button/ButtonContent';
import useTRPC from '@/lib/trpc/browser';

import useAgentSlug from '../../hooks/useAgentSlug';

export interface DeleteRoleAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: {
    id: string;
    name: string;
  };
}

const DeleteRoleAlert = ({
  open,
  onOpenChange,
  role
}: DeleteRoleAlertProps) => {
  const api = useTRPC();
  const queryClient = useQueryClient();
  const agentSlug = useAgentSlug();

  const { mutateAsync: deleteRole, isPending } = useMutation(
    api.agents.roles.delete.mutationOptions({
      onSuccess: () => {
        toast.success('Rol verwijderd');
        onOpenChange(false);
        void queryClient.invalidateQueries({
          queryKey: api.agents.roles.getMany.queryKey({ agentId: agentSlug })
        });
      },
      onError: (error) => {
        toast.error(error.message);
      }
    })
  );

  const handleDelete = async () => {
    await deleteRole({
      agentId: agentSlug,
      roleId: role.id
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Rol verwijderen</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogBody>
          <AlertDialogDescription>
            Weet je zeker dat je de rol &quot;{role.name}&quot; wilt
            verwijderen? Deze actie kan niet ongedaan worden gemaakt.
          </AlertDialogDescription>
        </AlertDialogBody>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="ghost">
              <ButtonContent>Annuleren</ButtonContent>
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              colorRole="danger"
              isDisabled={isPending}
              onClick={handleDelete}
            >
              <ButtonContent isLoading={isPending}>Verwijderen</ButtonContent>
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteRoleAlert;
