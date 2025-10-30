import { UIMessage, isToolOrDynamicToolUIPart } from 'ai';

/**
 * Check if the message is an assistant message with completed tool calls. The
 * last step of the message must have at least one tool invocation and all tool
 * invocations must have a result.
 *
 * This function skips automatic sending if the tool call includes a create
 * multiple choice tool call.
 */
const lastAssistantMessageIsCompleteWithToolCalls = ({
  messages
}: {
  messages: UIMessage[];
}) => {
  const message = messages[messages.length - 1];

  if (!message) {
    return false;
  }

  if (message.role !== 'assistant') {
    return false;
  }

  const lastStepStartIndex = message.parts.reduce((lastIndex, part, index) => {
    return part.type === 'step-start' ? index : lastIndex;
  }, -1);

  const lastStepToolInvocations = message.parts
    .slice(lastStepStartIndex + 1)
    .filter(isToolOrDynamicToolUIPart);

  // Alternative approach: Check if there are any multiple choice data parts in the message
  const hasMultipleChoiceData = message.parts.some(
    (part) => part.type === 'data-multiple-choice'
  );

  // If there's a multiple choice data part, don't auto-send
  if (hasMultipleChoiceData) {
    return false;
  }

  return (
    lastStepToolInvocations.length > 0 &&
    lastStepToolInvocations.every((part) => part.state === 'output-available')
  );
};

export default lastAssistantMessageIsCompleteWithToolCalls;
