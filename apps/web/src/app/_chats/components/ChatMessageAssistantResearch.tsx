import { IconChevronDown } from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import Expandable from '@/app/_ui/components/Expandable/Expandable';
import ExpandableContent from '@/app/_ui/components/Expandable/ExpandableContent';
import ExpandableToggle from '@/app/_ui/components/Expandable/ExpandableToggle';
import ShimmerText from '@/app/_ui/components/Typography/ShimmerText';
import Typography from '@/app/_ui/components/Typography/Typography';

export interface ChatMessageAssistantResearchProps {
  status: 'loading' | 'complete';
  title: string;
  body: string;
}

const ChatMessageAssistantResearch = ({
  title,
  body
}: ChatMessageAssistantResearchProps) => {
  // eslint-disable-next-line react-compiler/react-compiler
  'use no memo';

  return (
    <div className="my-2 max-w-4xl">
      <Expandable>
        <ExpandableToggle asChild>
          <button className="text-text-muted hover:text-text flex items-center gap-2 transition-colors">
            <ShimmerText>
              <Typography variant="bodySm">{title}</Typography>
            </ShimmerText>
            <IconChevronDown className="size-4 transition-transform data-[expanded=true]:rotate-180" />
          </button>
        </ExpandableToggle>

        <ExpandableContent className="mt-2 hidden data-[expanded=true]:block">
          <Typography variant="bodySm" className="text-text-muted" asChild>
            <div className="overflow-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
            </div>
          </Typography>
        </ExpandableContent>
      </Expandable>
    </div>
  );
};

export default ChatMessageAssistantResearch;
