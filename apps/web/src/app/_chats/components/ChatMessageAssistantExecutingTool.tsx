import { IconCheck } from '@tabler/icons-react';

import Icon from '@/app/_ui/components/Icon/Icon';
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
    <div className="bg-surface-muted shadow-short my-2 flex max-w-full items-center gap-2 self-start rounded-2xl px-3 py-2">
      <Icon icon={status === 'in_progress' ? IconSpinner : IconCheck} />
      <Typography variant="bodySm">{message}</Typography>
    </div>
  );
};

export default ChatMessageAssistantExecutingTool;
