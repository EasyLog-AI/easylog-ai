import Typography from '@/app/_ui/components/Typography/Typography';

export interface ChatMessageUserTextContentProps {
  text: string;
}

const ChatMessageUserTextContent = ({
  text
}: ChatMessageUserTextContentProps) => {
  if (text.startsWith('[') && text.endsWith(']')) {
    return null;
  }

  return (
    <div className="flex w-full justify-end">
      <div className="inline-flex max-w-2xl">
        <Typography
          variant="bodyMd"
          asChild
          className="text-text-brand-on-fill whitespace-pre-wrap break-words"
        >
          <span>{text}</span>
        </Typography>
      </div>
    </div>
  );
};

export default ChatMessageUserTextContent;
