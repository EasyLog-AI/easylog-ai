'use client';

import { DropzoneOptions } from 'react-dropzone';
import { toast } from 'sonner';

import UploadDropzone from '@/app/_ui/components/UploadDropzone/UploadDropzone';

interface DocumentsDropzoneProps extends DropzoneOptions {
  onFilesSelected?: (files: File[]) => void;
}

const DocumentsDropzone = ({
  children,
  onFilesSelected,
  ...props
}: React.PropsWithChildren<DocumentsDropzoneProps>) => {
  return (
    <UploadDropzone
      {...props}
      onDropRejected={(fileRejections) => {
        fileRejections.forEach((fileRejection) => {
          toast.error(
            fileRejection.errors.map((error) => error.message).join(', ')
          );
        });
      }}
      maxFiles={50}
      maxSize={50000000} // 50mb
      accept={{
        'application/pdf': ['.pdf'],
        'application/xml': ['.xml'],
        'text/xml': ['.xml'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
          '.xlsx'
        ]
      }}
      onDrop={(acceptedFiles) => {
        if (acceptedFiles.length === 0) {
          return;
        }

        onFilesSelected?.(acceptedFiles);
      }}
    >
      {children}
    </UploadDropzone>
  );
};

export default DocumentsDropzone;
