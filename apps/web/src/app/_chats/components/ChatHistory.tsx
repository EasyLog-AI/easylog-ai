'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import BarChart from '@/app/_charts/components/BarChart';
import LineChart from '@/app/_charts/components/LineChart';
import PieChart from '@/app/_charts/components/PieChart';
import StackedBarChart from '@/app/_charts/components/StackedBarChart';

import ChatMessageAssistant from './ChatMessageAssistant';
import ChatMessageAssistantMarkdownContent from './ChatMessageAssistantMarkdownContent';
import ChatMessageAssistantMultipleChoice from './ChatMessageAssistantMultipleChoice';
import ChatMessageAssistantReasoning from './ChatMessageAssistantReasoning';
import ChatMessageAssistantResearch from './ChatMessageAssistantResearch';
import ChatMessageFileContent from './ChatMessageFileContent';
import ChatMessageUser from './ChatMessageUser';
import ChatMessageUserTextContent from './ChatMessageUserTextContent';
import useChatContext from '../hooks/useChatContext';

const BOTTOM_THRESHOLD_PX = 56;

const ChatHistory = () => {
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, status, id } = useChatContext();

  const isAtBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    const distance = el.scrollHeight - (el.scrollTop + el.clientHeight);
    return distance <= BOTTOM_THRESHOLD_PX;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    scrollToBottom('auto');
  }, [scrollToBottom]);

  useEffect(() => {
    if (!isPinnedToBottom) return;
    scrollToBottom('smooth');
  }, [messages, status, isPinnedToBottom, scrollToBottom]);

  const handleScroll = () => {
    setIsPinnedToBottom(isAtBottom());
  };

  return (
    <div
      className="relative flex-1 overflow-y-auto p-3 md:p-10"
      ref={scrollRef}
      onScroll={handleScroll}
    >
      <div className="mx-auto max-w-2xl">
        <AnimatePresence>
          {messages.map((message) =>
            message.role === 'user' ? (
              <ChatMessageUser key={message.id}>
                {message.parts.map((part, i) =>
                  part.type === 'text' ? (
                    <ChatMessageUserTextContent
                      key={`${message.id}-${i}`}
                      text={part.text}
                    />
                  ) : part.type === 'file' ? (
                    <ChatMessageFileContent
                      key={`${message.id}-${i}`}
                      file={part}
                    />
                  ) : null
                )}
              </ChatMessageUser>
            ) : message.role === 'assistant' ? (
              <ChatMessageAssistant key={message.id}>
                {message.parts.map((part, i) =>
                  part.type === 'text' ? (
                    <ChatMessageAssistantMarkdownContent
                      key={`${message.id}-${i}`}
                      text={part.text}
                    />
                  ) : part.type === 'data-bar-chart' ? (
                    <BarChart key={`${message.id}-${i}`} config={part.data} />
                  ) : part.type === 'data-line-chart' ? (
                    <LineChart key={`${message.id}-${i}`} config={part.data} />
                  ) : part.type === 'data-pie-chart' ? (
                    <PieChart key={`${message.id}-${i}`} config={part.data} />
                  ) : part.type === 'data-stacked-bar-chart' ? (
                    <StackedBarChart
                      key={`${message.id}-${i}`}
                      config={part.data}
                    />
                  ) : part.type === 'data-research' ? (
                    <ChatMessageAssistantResearch
                      key={`${message.id}-${i}`}
                      status={part.data.status}
                      title={part.data.title}
                      body={part.data.body}
                    />
                  ) : part.type === 'reasoning' ? (
                    <ChatMessageAssistantReasoning
                      key={`${message.id}-${i}`}
                      text={part.text}
                      isStreaming={part.state === 'streaming'}
                    />
                  ) : part.type === 'data-multiple-choice' ? (
                    <ChatMessageAssistantMultipleChoice
                      key={`${message.id}-${i}`}
                      question={part.data.question}
                      options={part.data.options}
                      answer={part.data.answer}
                      multipleChoiceQuestionId={part.data.id}
                      chatId={id}
                      messageId={message.id}
                    />
                  ) : part.type === 'file' ? (
                    <ChatMessageFileContent
                      key={`${message.id}-${i}`}
                      file={part}
                    />
                  ) : null
                )}
              </ChatMessageAssistant>
            ) : null
          )}

          {status === 'submitted' ||
            (status === 'streaming' ? (
              <motion.div
                className="bg-fill-brand animate-scale-in size-3 rounded-full"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              />
            ) : null)}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatHistory;
