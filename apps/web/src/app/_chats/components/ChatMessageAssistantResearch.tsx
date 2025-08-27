import { IconCheck } from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import ContentWrapper from '@/app/_ui/components/ContentWrapper/ContentWrapper';
import IconSpinner from '@/app/_ui/components/Icon/IconSpinner';
import Typography from '@/app/_ui/components/Typography/Typography';

export interface ChatMessageAssistantResearchProps {
  status: 'loading' | 'complete';
  title: string;
  body: string;
}

const ChatMessageAssistantResearch = ({
  status,
  title,
  body
}: ChatMessageAssistantResearchProps) => {
  return (
    <div className="bg-surface-muted shadow-short max-w-lg overflow-auto rounded-xl p-3">
      <Typography variant="bodySm">
        <ContentWrapper
          iconLeft={status === 'loading' ? IconSpinner : IconCheck}
        >
          {title}
        </ContentWrapper>
      </Typography>

      <Typography variant="bodySm" className="text-text-muted">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
      </Typography>
    </div>
  );
};

export default ChatMessageAssistantResearch;
