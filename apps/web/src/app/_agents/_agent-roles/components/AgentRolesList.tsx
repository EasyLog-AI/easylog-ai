'use client';

import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';

import Button from '@/app/_ui/components/Button/Button';
import ButtonContent from '@/app/_ui/components/Button/ButtonContent';
import Card from '@/app/_ui/components/Card/Card';
import CardContent from '@/app/_ui/components/Card/CardContent';
import CardTitle from '@/app/_ui/components/Card/CardTitle';
import Typography from '@/app/_ui/components/Typography/Typography';
import useTRPC from '@/lib/trpc/browser';

import useAgentSlug from '../../hooks/useAgentSlug';
import AgentRoleForm from './AgentRoleForm';
import DeleteRoleAlert from './DeleteRoleAlert';

const AgentRolesList = () => {
  const api = useTRPC();
  const agentSlug = useAgentSlug();
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingRole, setDeletingRole] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data: roles } = useSuspenseQuery(
    api.agents.roles.getMany.queryOptions({
      agentId: agentSlug
    })
  );

  const handleCancelEdit = () => {
    setEditingRoleId(null);
    setIsCreating(false);
  };

  const handleSaveSuccess = () => {
    setEditingRoleId(null);
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      {!isCreating && !editingRoleId && (
        <>
          <Card>
            <CardContent>
              <CardTitle>Rollen</CardTitle>
              <div className="space-y-4">
                {roles.length === 0 ? (
                  <Typography variant="bodySm" className="text-text-muted">
                    Nog geen rollen aangemaakt
                  </Typography>
                ) : (
                  roles.map((role) => (
                    <div
                      key={role.id}
                      className="border-border-primary rounded-lg border p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Typography
                              variant="bodyMd"
                              className="text-text-primary font-medium"
                            >
                              {role.name}
                            </Typography>
                            {role.isDefault && (
                              <span className="bg-fill-muted text-text-muted rounded px-2 py-0.5 text-xs">
                                Standaard
                              </span>
                            )}
                          </div>
                          {role.description && (
                            <Typography
                              variant="bodySm"
                              className="text-text-muted mt-1"
                            >
                              {role.description}
                            </Typography>
                          )}
                          <div className="mt-2 flex gap-4">
                            <Typography variant="bodySm" className="text-text-muted">
                              Model: {role.model}
                            </Typography>
                            <Typography variant="bodySm" className="text-text-muted">
                              Provider: {role.provider}
                            </Typography>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingRoleId(role.id)}
                          >
                            <ButtonContent iconLeft={IconPencil}>
                              Bewerken
                            </ButtonContent>
                          </Button>
                          {!role.isDefault && (
                            <Button
                              size="sm"
                              variant="outline"
                              colorRole="danger"
                              onClick={() =>
                                setDeletingRole({ id: role.id, name: role.name })
                              }
                            >
                              <ButtonContent iconLeft={IconTrash}>
                                Verwijderen
                              </ButtonContent>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setIsCreating(true)}
                >
                  <ButtonContent iconLeft={IconPlus}>
                    Nieuwe rol toevoegen
                  </ButtonContent>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {isCreating && (
        <AgentRoleForm
          onCancel={handleCancelEdit}
          onSuccess={handleSaveSuccess}
        />
      )}

      {editingRoleId && (
        <AgentRoleForm
          role={roles.find((r) => r.id === editingRoleId)}
          onCancel={handleCancelEdit}
          onSuccess={handleSaveSuccess}
        />
      )}

      {deletingRole && (
        <DeleteRoleAlert
          open={!!deletingRole}
          onOpenChange={(open) => !open && setDeletingRole(null)}
          role={deletingRole}
        />
      )}
    </div>
  );
};

export default AgentRolesList;
