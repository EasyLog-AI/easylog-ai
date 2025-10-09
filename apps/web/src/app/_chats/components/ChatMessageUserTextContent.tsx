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
    <div className="bg-surface-muted prose max-w-lg rounded-xl p-3 whitespace-pre-wrap">
      {text}
    </div>
  );
};

export default ChatMessageUserTextContent;
