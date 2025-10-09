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
    <div
      className="prose max-w-2xl whitespace-pre-wrap rounded-xl px-3 py-2"
      style={{
        background: 'linear-gradient(135deg, #73C3FF 0%, #9DD7FF 100%)',
        color: 'white'
      }}
    >
      {text}
    </div>
  );
};

export default ChatMessageUserTextContent;
