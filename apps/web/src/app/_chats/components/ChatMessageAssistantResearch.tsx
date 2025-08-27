import { IconCheck } from '@tabler/icons-react';

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
    <div className="bg-surface-muted max-w-lg rounded-xl p-3">
      <Typography variant="bodySm">
        <ContentWrapper
          iconLeft={status === 'loading' ? IconSpinner : IconCheck}
        >
          {title}
        </ContentWrapper>
      </Typography>

      <Typography variant="bodySm" className="text-text-muted">
        {body}
      </Typography>
    </div>
  );
};

export default ChatMessageAssistantResearch;
