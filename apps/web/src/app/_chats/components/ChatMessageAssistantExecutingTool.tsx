import { IconCheck } from '@tabler/icons-react';

import ContentWrapper from '@/app/_ui/components/ContentWrapper/ContentWrapper';
import IconSpinner from '@/app/_ui/components/Icon/IconSpinner';
import Typography from '@/app/_ui/components/Typography/Typography';

export interface ChatMessageAssistantExecutingToolProps {
  status: 'in_progress' | 'completed';
  message: string;
}

const ChatMessageAssistantExecutingTool = ({
  status,
  message
}: ChatMessageAssistantExecutingToolProps) => {
  // eslint-disable-next-line react-compiler/react-compiler
  'use no memo';

  return (
    <div className="bg-surface-muted shadow-short my-2 w-fit overflow-auto rounded-xl px-3 py-2">
      <Typography variant="bodySm">
        <ContentWrapper
          className="h-8"
          iconLeft={status === 'in_progress' ? IconSpinner : IconCheck}
        >
          {message}
        </ContentWrapper>
      </Typography>
    </div>
  );
};

export default ChatMessageAssistantExecutingTool;
