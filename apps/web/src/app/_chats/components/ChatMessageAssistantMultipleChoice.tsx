import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery
} from '@tanstack/react-query';

import useAgentSlug from '@/app/_agents/hooks/useAgentSlug';
import Typography from '@/app/_ui/components/Typography/Typography';
import useTRPC from '@/lib/trpc/browser';

import useChatContext from '../hooks/useChatContext';

export interface ChatMessageAssistantMultipleChoiceProps {
  question: string;
  options: string[];
  answer?: string | null;
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

  const currentValue = multipleChoiceQuestion?.value || answer;

  return (
    <div className="bg-surface-muted shadow-short my-2 max-w-2xl space-y-4 overflow-auto rounded-xl p-3">
      <Typography variant="labelMd">{question}</Typography>

      <div className="grid gap-2">
        {options.map((option) => {
          const isSelected = currentValue === option;
          const isDisabled = Boolean(currentValue && currentValue !== option);

          return (
            <button
              key={option}
              disabled={isPending || isDisabled}
              className="flex h-10 items-center justify-center rounded-lg px-3 text-sm transition-all duration-150"
              style={{
                background: isSelected
                  ? 'linear-gradient(135deg, #4A9FD8 0%, #5BB3E6 100%)' // Selected: donkerdere gradient
                  : 'linear-gradient(135deg, #73C3FF 0%, #9DD7FF 100%)', // Unselected: gradient
                color: 'white',
                border: 'none',
                boxShadow: isSelected
                  ? '0 2px 8px rgba(74, 159, 216, 0.3)'
                  : 'none',
                cursor: isPending || isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.5 : 1
              }}
              onClick={() => {
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
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChatMessageAssistantMultipleChoice;
