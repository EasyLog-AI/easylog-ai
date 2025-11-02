'use client';

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery
} from '@tanstack/react-query';
import { upload } from '@vercel/blob/client';
import { useState } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

import useAgentSlug from '@/app/_agents/hooks/useAgentSlug';
import Button from '@/app/_ui/components/Button/Button';
import ButtonContent from '@/app/_ui/components/Button/ButtonContent';
import Checkbox from '@/app/_ui/components/Checkbox/Checkbox';
import Combobox from '@/app/_ui/components/Combobox/Combobox';
import ComboboxContent from '@/app/_ui/components/Combobox/ComboboxContent';
import ComboboxInput from '@/app/_ui/components/Combobox/ComboboxInput';
import ComboboxItem from '@/app/_ui/components/Combobox/ComboboxItem';
import ComboboxItemContent from '@/app/_ui/components/Combobox/ComboboxItemContent';
import ComboboxList from '@/app/_ui/components/Combobox/ComboboxList';
import ComboboxTrigger from '@/app/_ui/components/Combobox/ComboboxTrigger';
import ComboboxTriggerContent from '@/app/_ui/components/Combobox/ComboboxTriggerContent';
import ComboboxEmpty from '@/app/_ui/components/Combobox/ComboxboxEmpty';
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

import DocumentsDropzone from './DocumentsDropzone';

const AddDocumentDialog = ({ children }: React.PropsWithChildren<{}>) => {
  const api = useTRPC();
  const agentSlug = useAgentSlug();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [allRoles, setAllRoles] = useState(true);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const { data: agent } = useSuspenseQuery(
    api.agents.get.queryOptions({
      agentId: agentSlug
    })
  );
  const { data: roles } = useSuspenseQuery(
    api.agents.roles.getMany.queryOptions({
      agentId: agentSlug
    })
  );

  const { data: allDocuments } = useSuspenseQuery(
    api.documents.getMany.queryOptions({
      cursor: 0,
      limit: 500
    })
  );

  const otherAgentDocuments = allDocuments.data.filter(
    (doc) => doc.agentId !== agent.id
  );

  const { mutateAsync: copyDocument, isPending: isCopyPending } = useMutation(
    api.documents.copy.mutationOptions({
      onSuccess: () => {
        toast.success('Document gekopieerd');
        void queryClient.refetchQueries({
          queryKey: api.documents.getMany.queryKey({
            cursor: 0,
            limit: 100,
            filter: {
              agentId: agentSlug
            }
          })
        });
        handleClose();
      },
      onError: (error) => {
        toast.error(error.message);
      }
    })
  );

  const { mutateAsync: uploadFiles, isPending: isUploadPending } = useMutation({
    mutationFn: async (files: File[]) => {
      return await Promise.all(
        files.map(async (file) => {
          const uploadResult = await upload(`${uuidv4()}/${file.name}`, file, {
            access: 'public',
            handleUploadUrl: `/api/documents/upload`,
            clientPayload: JSON.stringify({
              agentId: agent.id,
              allRoles,
              roleIds: allRoles ? [] : selectedRoleIds
            })
          });

          return uploadResult;
        })
      );
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({
        queryKey: api.documents.getMany.queryKey({
          cursor: 0,
          limit: 100,
          filter: {
            agentId: agentSlug
          }
        })
      });
      toast.success('Documenten geüpload');
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleClose = () => {
    setIsOpen(false);
    setSelectedDocumentId('');
    setSelectedFiles([]);
    setAllRoles(true);
    setSelectedRoleIds([]);
  };

  const handleCopy = async () => {
    if (!selectedDocumentId) {
      toast.error('Selecteer een document om te kopiëren');
      return;
    }

    await copyDocument({
      documentId: selectedDocumentId,
      targetAgentId: agent.id
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Selecteer bestanden om te uploaden');
      return;
    }

    if (!allRoles && selectedRoleIds.length === 0) {
      toast.error('Selecteer minimaal één rol');
      return;
    }

    await uploadFiles(selectedFiles);
  };

  const handleRoleToggle = (roleId: string, checked: boolean) => {
    if (checked) {
      setSelectedRoleIds((prev) => [...prev, roleId]);
    } else {
      setSelectedRoleIds((prev) => prev.filter((id) => id !== roleId));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Document toevoegen</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-6">
            {/* Copy from other agent */}
            {!selectedFiles.length && (
              <>
                <FormField>
                  <FormFieldLabel>
                    Kopieer document van andere agent
                  </FormFieldLabel>
                  <FormFieldContent>
                    {otherAgentDocuments.length === 0 ? (
                      <Typography variant="bodySm" className="text-text-muted">
                        Geen documenten beschikbaar van andere agents
                      </Typography>
                    ) : (
                      <Combobox
                        debounceMs={0}
                        items={otherAgentDocuments}
                        idField="id"
                        value={selectedDocumentId}
                        onValueChange={(value) =>
                          setSelectedDocumentId(value ?? '')
                        }
                        fuseOptions={{
                          keys: ['name', 'agent.name'],
                          threshold: 0.3
                        }}
                      >
                        {(context) => (
                          <>
                            <ComboboxTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start"
                              >
                                <ComboboxTriggerContent placeholder="Selecteer een document">
                                  {context.activeItem?.name}
                                </ComboboxTriggerContent>
                              </Button>
                            </ComboboxTrigger>
                            <ComboboxContent>
                              <ComboboxInput placeholder="Zoek document..." />
                              <ComboboxList>
                                <ComboboxEmpty>
                                  Geen documenten gevonden
                                </ComboboxEmpty>
                                {context.results?.map((document) => (
                                  <ComboboxItem
                                    key={document.id}
                                    value={document.id}
                                  >
                                    <ComboboxItemContent value={document.id}>
                                      <div className="flex flex-col">
                                        <Typography variant="bodySm">
                                          {document.name}
                                        </Typography>
                                        <Typography
                                          variant="bodySm"
                                          className="text-text-muted"
                                        >
                                          van {document.agent.name}
                                        </Typography>
                                      </div>
                                    </ComboboxItemContent>
                                  </ComboboxItem>
                                ))}
                              </ComboboxList>
                            </ComboboxContent>
                          </>
                        )}
                      </Combobox>
                    )}
                  </FormFieldContent>
                </FormField>

                {/* Separator */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="border-border-primary w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-surface-primary text-text-muted px-2">
                      Of upload nieuwe
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Upload new document */}
            <div className="space-y-4">
              <DocumentsDropzone onFilesSelected={setSelectedFiles}>
                {selectedFiles.length === 0 ? (
                  <div className="border-border-primary hover:bg-surface-primary-hover active:bg-surface-primary-active flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-8 transition-all">
                    <Typography variant="bodyMd" className="text-center">
                      Klik of sleep hier documenten
                    </Typography>
                    <Typography
                      variant="bodySm"
                      className="text-text-muted mt-2 text-center"
                    >
                      PDF, XML, XLSX (max 50MB per bestand)
                    </Typography>
                  </div>
                ) : (
                  <div className="border-border-primary rounded-lg border p-4">
                    <Typography
                      variant="bodySm"
                      className="text-text-muted mb-2"
                    >
                      Geselecteerde bestanden:
                    </Typography>
                    <div className="divide-border-primary">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="bg-surface-secondary flex items-start justify-between gap-2 rounded py-2"
                        >
                          <Typography variant="bodySm">{file.name}</Typography>
                          <Typography
                            variant="bodySm"
                            className="text-text-muted whitespace-nowrap text-right"
                          >
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </Typography>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </DocumentsDropzone>

              {/* Role access for uploads */}
              {selectedFiles.length > 0 && (
                <FormField>
                  <FormFieldLabel>Toegang</FormFieldLabel>
                  <FormFieldContent>
                    <div className="space-y-3">
                      {/* All Roles Checkbox */}
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="allRoles"
                          checked={allRoles}
                          onCheckedChange={(checked) =>
                            setAllRoles(checked === true)
                          }
                        />
                        <label htmlFor="allRoles" className="cursor-pointer">
                          <Typography variant="bodySm">
                            Alle rollen hebben toegang
                          </Typography>
                        </label>
                      </div>

                      {/* Specific Roles */}
                      {!allRoles && (
                        <div className="space-y-2 pl-6">
                          {roles.length === 0 ? (
                            <Typography
                              variant="bodySm"
                              className="text-text-muted"
                            >
                              Geen rollen beschikbaar
                            </Typography>
                          ) : (
                            roles.map((role) => (
                              <div
                                key={role.id}
                                className="flex items-center gap-2"
                              >
                                <Checkbox
                                  id={`role-${role.id}`}
                                  checked={selectedRoleIds.includes(role.id)}
                                  onCheckedChange={(checked) =>
                                    handleRoleToggle(role.id, checked === true)
                                  }
                                />
                                <label
                                  htmlFor={`role-${role.id}`}
                                  className="cursor-pointer"
                                >
                                  <Typography variant="bodySm">
                                    {role.name}
                                  </Typography>
                                </label>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </FormFieldContent>
                </FormField>
              )}
            </div>
          </div>
        </DialogBody>
        {(selectedDocumentId || selectedFiles.length > 0) && (
          <DialogFooter>
            <Button variant="ghost" onClick={handleClose}>
              <ButtonContent>Annuleren</ButtonContent>
            </Button>
            {selectedDocumentId ? (
              <Button
                colorRole="brand"
                isDisabled={isCopyPending || !selectedDocumentId}
                onClick={handleCopy}
              >
                <ButtonContent isLoading={isCopyPending}>
                  Kopiëren
                </ButtonContent>
              </Button>
            ) : (
              <Button
                colorRole="brand"
                isDisabled={
                  isUploadPending ||
                  selectedFiles.length === 0 ||
                  (!allRoles && selectedRoleIds.length === 0)
                }
                onClick={handleUpload}
              >
                <ButtonContent isLoading={isUploadPending}>
                  Uploaden
                </ButtonContent>
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddDocumentDialog;
