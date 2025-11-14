import Typography from '@/app/_ui/components/Typography/Typography';

import removeFormattingMarkers from '../utils/removeFormattingMarkers';

export interface ChatMessageUserTextContentProps {
  text: string;
}

const ChatMessageUserTextContent = ({
  text
}: ChatMessageUserTextContentProps) => {
  const formattedText = removeFormattingMarkers(text);

  if (formattedText.length === 0) {
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
          <span>{formattedText}</span>
        </Typography>
      </div>
    </div>
  );
};

export default ChatMessageUserTextContent;
