import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery
} from '@tanstack/react-query';

import useAgentSlug from '@/app/_agents/hooks/useAgentSlug';
import Checkbox from '@/app/_ui/components/Checkbox/Checkbox';
import ContentWrapper from '@/app/_ui/components/ContentWrapper/ContentWrapper';
import Typography from '@/app/_ui/components/Typography/Typography';
import useTRPC from '@/lib/trpc/browser';

import useChatContext from '../hooks/useChatContext';

export interface ChatMessageAssistantMultipleChoiceProps {
  question: string;
  options: string[];
  answer: string | null;
  chatId: string;
  multipleChoiceQuestionId: string;
  messageId: string;
}

const ChatMessageAssistantMultipleChoice = ({
  question,
  options,
  answer,
  chatId,
  multipleChoiceQuestionId,
  messageId
}: ChatMessageAssistantMultipleChoiceProps) => {
  const api = useTRPC();
  const queryClient = useQueryClient();

  const { mutate: updateMultipleChoiceAnswer, isPending } = useMutation(
    api.multipleChoice.update.mutationOptions({
      onMutate: async (newValue) => {
        await queryClient.cancelQueries({
          queryKey: api.chats.getOrCreate.queryKey({ agentId: agentSlug })
        });
        await queryClient.cancelQueries({
          queryKey: api.multipleChoice.get.queryKey({
            chatId,
            multipleChoiceQuestionId
          })
        });

        const previousValue = multipleChoiceQuestion?.value;

        queryClient.setQueryData(
          api.multipleChoice.get.queryKey({
            chatId,
            multipleChoiceQuestionId
          }),
          (old: typeof multipleChoiceQuestion) => {
            if (!old) return old;
            return {
              ...old,
              value: newValue.value
            };
          }
        );

        return { previousValue };
      },
      onSuccess: () => {
        // Invalidate and refetch on success to ensure fresh data
        void queryClient.invalidateQueries({
          queryKey: api.chats.getOrCreate.queryKey({ agentId: agentSlug })
        });
        void queryClient.invalidateQueries({
          queryKey: api.multipleChoice.get.queryKey({
            chatId,
            multipleChoiceQuestionId
          })
        });
      },
      onError: (_err, _newValue, context) => {
        if (context?.previousValue !== undefined) {
          queryClient.setQueryData(
            api.multipleChoice.get.queryKey({
              chatId,
              multipleChoiceQuestionId
            }),
            (old: typeof multipleChoiceQuestion) => {
              if (!old) return old;
              return {
                ...old,
                value: context.previousValue ?? null
              };
            }
          );
        }
      },
      onSettled: () => {
        void refetchChat();
        void refetchMultipleChoiceQuestion();
      }
    })
  );

  const agentSlug = useAgentSlug();

  const { refetch: refetchChat } = useSuspenseQuery(
    api.chats.getOrCreate.queryOptions({
      agentId: agentSlug
    })
  );

  const {
    data: multipleChoiceQuestion,
    refetch: refetchMultipleChoiceQuestion
  } = useQuery(
    api.multipleChoice.get.queryOptions({
      chatId,
      multipleChoiceQuestionId
    })
  );

  const { sendMessage, messages } = useChatContext();

  const isLastMessage = messages[messages.length - 1].id === messageId;

  const hasAnswer = multipleChoiceQuestion?.value || answer;

  if (hasAnswer) {
    return (
      <div className="bg-surface-muted shadow-short my-2 max-w-lg space-y-2 overflow-auto rounded-xl p-3">
        <Typography variant="labelSm">{question}</Typography>
        <div className="flex flex-col gap-2">
          <ContentWrapper
            contentLeft={<Checkbox checked={true} disabled={true} />}
          >
            {multipleChoiceQuestion?.value || answer}
          </ContentWrapper>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-muted shadow-short my-2 max-w-lg space-y-2 overflow-auto rounded-xl p-3">
      <Typography variant="labelSm">{question}</Typography>

      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <label key={option} htmlFor={option}>
            <ContentWrapper
              contentLeft={
                <Checkbox
                  id={`${messageId}-${option}-${multipleChoiceQuestionId}`}
                  checked={
                    multipleChoiceQuestion?.value === option ||
                    answer === option
                  }
                  onCheckedChange={() => {
                    updateMultipleChoiceAnswer({
                      value: option,
                      chatId: chatId,
                      multipleChoiceQuestionId: multipleChoiceQuestionId
                    });
                    if (isLastMessage) {
                      void sendMessage({
                        text: `[${option}]`
                      });
                    }
                  }}
                  disabled={isPending}
                />
              }
            >
              {option}
            </ContentWrapper>
          </label>
        ))}
      </div>
    </div>
  );
};

export default ChatMessageAssistantMultipleChoice;
