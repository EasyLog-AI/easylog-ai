'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import ChatMessageAssistant from './ChatMessageAssistant';
import ChatMessageAssistantChart from './ChatMessageAssistantChart';
import ChatMessageAssistantMarkdownContent from './ChatMessageAssistantMarkdownContent';
import ChatMessageAssistantMultipleChoice from './ChatMessageAssistantMultipleChoice';
import ChatMessageAssistantReasoning from './ChatMessageAssistantReasoning';
import ChatMessageAssistantResearch from './ChatMessageAssistantResearch';
import ChatMessageUser from './ChatMessageUser';
import ChatMessageUserTextContent from './ChatMessageUserTextContent';
import useChatContext from '../hooks/useChatContext';

const BOTTOM_THRESHOLD_PX = 56;

const ChatHistory = () => {
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollingProgrammatically = useRef(false);

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
    isScrollingProgrammatically.current = true;
    el.scrollTo({ top: el.scrollHeight, behavior });
    // Reset the flag after scroll completes
    setTimeout(() => {
      isScrollingProgrammatically.current = false;
    }, behavior === 'auto' ? 0 : 500);
  }, []);

  useEffect(() => {
    scrollToBottom('auto');
  }, [scrollToBottom]);

  useEffect(() => {
    if (!isPinnedToBottom) return;
    scrollToBottom('smooth');
  }, [messages, status, isPinnedToBottom, scrollToBottom]);

  const handleScroll = () => {
    // If this is programmatic scrolling, don't change pin state
    if (isScrollingProgrammatically.current) {
      return;
    }
    
    // User is scrolling manually - check if they're at bottom
    const atBottom = isAtBottom();
    setIsPinnedToBottom(atBottom);
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
                {message.parts.map(
                  (part, i) =>
                    part.type === 'text' && (
                      <ChatMessageUserTextContent
                        key={`${message.id}-${i}`}
                        text={part.text}
                      />
                    )
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
                  ) : part.type === 'data-chart' ? (
                    <ChatMessageAssistantChart
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
