import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery
} from '@tanstack/react-query';

import useAgentSlug from '@/app/_agents/hooks/useAgentSlug';
import Button from '@/app/_ui/components/Button/Button';
import ButtonContent from '@/app/_ui/components/Button/ButtonContent';
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
    <div className="my-2 max-w-xl space-y-3">
      <Typography variant="labelMd">{question}</Typography>

      <div className="grid gap-1.5">
        {options.map((option) => {
          const isSelected = currentValue === option;
          const isDisabled = Boolean(currentValue && currentValue !== option);

          return (
            <Button
              key={option}
              size="lg"
              colorRole="brand"
              className="min-h-13 w-full"
              isDisabled={isPending || isDisabled}
              isToggled={isSelected}
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
              <ButtonContent className="w-full justify-center" size="lg">
                <Typography
                  variant="labelSm"
                  className="text-text-brand-on-fill"
                  asChild
                >
                  <span>{option}</span>
                </Typography>
              </ButtonContent>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default ChatMessageAssistantMultipleChoice;
