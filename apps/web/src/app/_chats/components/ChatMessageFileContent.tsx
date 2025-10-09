import { FileUIPart } from 'ai';
import Image from 'next/image';

export interface ChatMessageFileContentProps {
  file: FileUIPart;
}

const ChatMessageFileContent = ({ file }: ChatMessageFileContentProps) => {
  if (!file.mediaType.startsWith('image/')) {
    return null;
  }

  return (
    <div className="bg-surface-muted prose max-w-2xl overflow-hidden rounded-xl">
      <Image
        src={file.url}
        alt={file.filename ?? 'File'}
        width={500}
        height={500}
        className="h-auto"
      />
    </div>
  );
};

export default ChatMessageFileContent;
