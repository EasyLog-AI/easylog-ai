import { IconBrain } from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import ContentWrapper from '@/app/_ui/components/ContentWrapper/ContentWrapper';
import Expandable from '@/app/_ui/components/Expandable/Expandable';
import ExpandableContent from '@/app/_ui/components/Expandable/ExpandableContent';
import ExpandableToggle from '@/app/_ui/components/Expandable/ExpandableToggle';
import Typography from '@/app/_ui/components/Typography/Typography';

export interface ChatMessageAssistantReasoningProps {
  text: string;
}

const ChatMessageAssistantReasoning = ({
  text
}: ChatMessageAssistantReasoningProps) => {
  return (
    <div className="bg-surface-muted shadow-short max-w-lg rounded-xl p-3">
      <div className="mb-2">
        <ContentWrapper iconLeft={IconBrain}>Reasoning</ContentWrapper>
      </div>

      <Expandable>
        <ExpandableContent className="line-clamp-3 data-[expanded=true]:line-clamp-none">
          <Typography variant="bodySm" className="text-text-muted" asChild>
            <div>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
            </div>
          </Typography>
        </ExpandableContent>

        <ExpandableToggle className="mt-2">Show more</ExpandableToggle>
      </Expandable>
    </div>
  );
};

export default ChatMessageAssistantReasoning;
