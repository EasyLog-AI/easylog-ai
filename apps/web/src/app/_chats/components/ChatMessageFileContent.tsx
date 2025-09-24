import { FileUIPart } from 'ai';

export interface ChatMessageFileContentProps {
  file: FileUIPart;
}

const ChatMessageFileContent = ({ file }: ChatMessageFileContentProps) => {
  if (!file.mediaType.startsWith('image/')) {
    return null;
  }

  return (
    <div className="bg-surface-muted prose max-w-lg overflow-hidden rounded-xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={file.url} alt={file.filename ?? 'File'} />
    </div>
  );
};

export default ChatMessageFileContent;
