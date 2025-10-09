import { IconBrain, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import Button from '@/app/_ui/components/Button/Button';
import ButtonContent from '@/app/_ui/components/Button/ButtonContent';
import ContentWrapper from '@/app/_ui/components/ContentWrapper/ContentWrapper';
import Expandable from '@/app/_ui/components/Expandable/Expandable';
import ExpandableContent from '@/app/_ui/components/Expandable/ExpandableContent';
import ExpandableToggle from '@/app/_ui/components/Expandable/ExpandableToggle';
import Icon from '@/app/_ui/components/Icon/Icon';
import IconSpinner from '@/app/_ui/components/Icon/IconSpinner';
import Typography from '@/app/_ui/components/Typography/Typography';

export interface ChatMessageAssistantReasoningProps {
  text: string;
  isStreaming?: boolean;
}

const ChatMessageAssistantReasoning = ({
  text,
  isStreaming = false
}: ChatMessageAssistantReasoningProps) => {
  const formattedText = text.replaceAll('[REDACTED]', '').trim();

  if (formattedText.length === 0) {
    return null;
  }

  return (
    <div className="bg-surface-muted shadow-short relative my-2 max-w-2xl space-y-2 rounded-xl p-3">
      <Typography variant="labelSm" className="w-full">
        <ContentWrapper
          className="w-full"
          size="sm"
          align="start"
          contentLeft={
            isStreaming ? (
              <Icon icon={IconSpinner} />
            ) : (
              <Icon icon={IconBrain} colorRole="muted" />
            )
          }
        >
          Reasoning
        </ContentWrapper>
      </Typography>
      <Expandable>
        <ExpandableContent className="prose-sm data-[expanded=false]:line-clamp-3 data-[expanded=true]:line-clamp-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {text.replaceAll('[REDACTED]', '')}
          </ReactMarkdown>
        </ExpandableContent>

        <ExpandableToggle className="mt-2 data-[expanded=true]:hidden" asChild>
          <Button size="sm" variant="ghost">
            <ButtonContent iconRight={IconChevronDown}>Show more</ButtonContent>
          </Button>
        </ExpandableToggle>
        <ExpandableToggle
          className="mt-2 data-[expanded=true]:inline-flex data-[expanded=false]:hidden"
          asChild
        >
          <Button size="sm" variant="ghost">
            <ButtonContent iconRight={IconChevronUp}>Show less</ButtonContent>
          </Button>
        </ExpandableToggle>
      </Expandable>
    </div>
  );
};

export default ChatMessageAssistantReasoning;
