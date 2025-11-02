'use client';

import { IconPlus, IconSettings } from '@tabler/icons-react';
import {
  useSuspenseInfiniteQuery,
  useSuspenseQuery
} from '@tanstack/react-query';
import { useState } from 'react';

import useAgentSlug from '@/app/_agents/hooks/useAgentSlug';
import Button from '@/app/_ui/components/Button/Button';
import ButtonContent from '@/app/_ui/components/Button/ButtonContent';
import Card from '@/app/_ui/components/Card/Card';
import CardContent from '@/app/_ui/components/Card/CardContent';
import CardTitle from '@/app/_ui/components/Card/CardTitle';
import DialogTrigger from '@/app/_ui/components/Dialog/DialogTrigger';
import Typography from '@/app/_ui/components/Typography/Typography';
import useTRPC from '@/lib/trpc/browser';

import AddDocumentDialog from './AddDocumentDialog';
import DocumentRoleAccessDialog from './DocumentRoleAccessDialog';

const KnowledgeBaseSettings = () => {
  const api = useTRPC();
  const agentSlug = useAgentSlug();
  const [selectedDocument, setSelectedDocument] = useState<{
    id: string;
    name: string;
    allRoles: boolean;
    roleIds: string[];
  } | null>(null);

  const { data: documentData } = useSuspenseInfiniteQuery(
    api.documents.getMany.infiniteQueryOptions(
      {
        cursor: 0,
        limit: 100,
        filter: {
          agentId: agentSlug
        }
      },
      {
        getNextPageParam: (lastPage) => lastPage.meta.nextCursor,
        getPreviousPageParam: (firstPage) => firstPage.meta.previousCursor
      }
    )
  );

  const { data: roles } = useSuspenseQuery(
    api.agents.roles.getMany.queryOptions({
      agentId: agentSlug
    })
  );

  const documents = documentData.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <CardTitle>Kennisbank</CardTitle>
          <div className="space-y-4">
            <AddDocumentDialog>
              <DialogTrigger asChild>
                <Button>
                  <ButtonContent iconLeft={IconPlus}>
                    Document toevoegen
                  </ButtonContent>
                </Button>
              </DialogTrigger>
            </AddDocumentDialog>

            {documents.length === 0 ? (
              <Typography variant="bodySm" className="text-text-muted">
                Nog geen documenten toegevoegd aan deze agent
              </Typography>
            ) : (
              <div className="space-y-2">
                {documents.map((document) => {
                  const hasAllRoles = document.roles.some(
                    (r) => r.agentRoleId === null
                  );
                  const specificRoleIds = document.roles
                    .filter((r) => r.agentRoleId !== null)
                    .map((r) => r.agentRoleId!);

                  return (
                    <div
                      key={document.id}
                      className="border-border-primary rounded-lg border p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Typography variant="bodySm">
                            {document.name}
                          </Typography>
                          {document.summary && (
                            <Typography
                              variant="bodySm"
                              className="text-text-muted"
                            >
                              {document.summary}
                            </Typography>
                          )}
                          <div className="mt-2">
                            <Typography
                              variant="bodySm"
                              className="text-text-muted"
                            >
                              Toegang:{' '}
                              {hasAllRoles
                                ? 'Alle rollen'
                                : specificRoleIds.length > 0
                                  ? specificRoleIds
                                      .map(
                                        (roleId) =>
                                          roles.find(
                                            (role) => role.id === roleId
                                          )?.name
                                      )
                                      .join(', ')
                                  : 'Geen rollen'}
                            </Typography>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setSelectedDocument({
                              id: document.id,
                              name: document.name,
                              allRoles: hasAllRoles,
                              roleIds: specificRoleIds
                            })
                          }
                        >
                          <ButtonContent iconLeft={IconSettings}>
                            Toegang beheren
                          </ButtonContent>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedDocument && (
        <DocumentRoleAccessDialog
          open={!!selectedDocument}
          onOpenChange={(open) => !open && setSelectedDocument(null)}
          document={selectedDocument}
        />
      )}
    </div>
  );
};

export default KnowledgeBaseSettings;
