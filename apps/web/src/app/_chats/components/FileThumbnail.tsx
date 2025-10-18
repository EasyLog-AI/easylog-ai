import {
  IconFile,
  IconFileDescription,
  IconFileTypePdf
} from '@tabler/icons-react';
import { FileUIPart } from 'ai';
import Image from 'next/image';
import { useEffect, useMemo } from 'react';

import Icon from '@/app/_ui/components/Icon/Icon';

type FileThumbnailProps = {
  file: File | FileUIPart;
  className?: string;
  iconClassName?: string;
  size?: 'sm' | 'md';
};

const FileThumbnail = ({
  file,
  className,
  iconClassName,
  size = 'md'
}: FileThumbnailProps) => {
  const isFileInstance = file instanceof File;

  const fileDetails = useMemo(() => {
    return {
      name: isFileInstance ? file.name : (file.filename ?? 'File'),
      type: isFileInstance ? file.type : file.mediaType,
      url: isFileInstance ? URL.createObjectURL(file) : file.url
    };
  }, [file, isFileInstance]);

  useEffect(() => {
    // Revoke the object URL when the component unmounts or the file changes
    // to prevent memory leaks, but only if it was created from a File instance.
    return () => {
      if (isFileInstance && fileDetails.url) {
        URL.revokeObjectURL(fileDetails.url);
      }
    };
  }, [isFileInstance, fileDetails.url]);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10'
  };

  if (fileDetails.type.startsWith('image/')) {
    return (
      <Image
        src={fileDetails.url}
        alt={fileDetails.name}
        width={size === 'sm' ? 32 : 40}
        height={size === 'sm' ? 32 : 40}
        className={`shrink-0 rounded-md object-cover ${sizeClasses[size]} ${
          className ?? ''
        }`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-md ${
        sizeClasses[size]
      } ${className ?? ''}`}
    >
      {fileDetails.type === 'application/pdf' ? (
        <Icon icon={IconFileTypePdf} className={iconClassName} />
      ) : fileDetails.type.startsWith(
          'application/vnd.openxmlformats-officedocument'
        ) || fileDetails.type === 'application/msword' ? (
        <Icon icon={IconFileDescription} className={iconClassName} />
      ) : (
        <Icon icon={IconFile} className={iconClassName} />
      )}
    </div>
  );
};

export default FileThumbnail;
