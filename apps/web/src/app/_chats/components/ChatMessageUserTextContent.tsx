import Typography from '@/app/_ui/components/Typography/Typography';

export interface ChatMessageUserTextContentProps {
  text: string;
  _isHidden?: boolean;
}

const ChatMessageUserTextContent = ({
  text,
  _isHidden = false
}: ChatMessageUserTextContentProps) => {
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
