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
    <div className="max-w-4xl">
      <div className="from-fill-brand to-fill-brand-2 shadow-fill-brand/20 inline-flex rounded-2xl bg-gradient-to-tr px-4 py-3 shadow-md">
        <Typography
          variant="bodyMd"
          asChild
          className="text-text-brand-on-fill whitespace-pre-wrap"
        >
          <span>{text}</span>
        </Typography>
      </div>
    </div>
  );
};

export default ChatMessageUserTextContent;
