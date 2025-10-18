import { FileUIPart } from 'ai';

import FileThumbnail from './FileThumbnail';

export interface ChatMessageFileContentProps {
  file: FileUIPart;
}

const ChatMessageFileContent = ({ file }: ChatMessageFileContentProps) => {
  if (file.mediaType.startsWith('image/')) {
    return (
      <div className="max-w-sm overflow-hidden rounded-xl">
        <FileThumbnail file={file} className="h-auto w-full" />
      </div>
    );
  }

  return (
    <div className="flex max-w-fit items-center gap-3">
      <FileThumbnail
        file={file}
        className="bg-surface-inverse-alpha-20% text-text-brand-on-fill"
      />
      <span className="text-text-brand-on-fill max-w-[200px] truncate font-medium">
        {file.filename}
      </span>
    </div>
  );
};

export default ChatMessageFileContent;
