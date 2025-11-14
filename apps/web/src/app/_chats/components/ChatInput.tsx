'use client';

import {
  IconMicrophone,
  IconMicrophoneFilled,
  IconMicrophoneOff,
  IconPlayerStop,
  IconPlus,
  IconSend,
  IconX
} from '@tabler/icons-react';
import { motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { SubmitHandler } from 'react-hook-form';
import TextareaAutosize from 'react-textarea-autosize';
import { z } from 'zod';

import { useRealTime } from '@/app/_realtime/hooks/useRealTime';
import Button from '@/app/_ui/components/Button/Button';
import ButtonContent from '@/app/_ui/components/Button/ButtonContent';
import Icon from '@/app/_ui/components/Icon/Icon';
import IconSpinner from '@/app/_ui/components/Icon/IconSpinner';
import useZodForm from '@/app/_ui/hooks/useZodForm';

import FileThumbnail from './FileThumbnail';
import useChatContext from '../hooks/useChatContext';

const schema = z
  .object({
    content: z.string().optional(),
    // Looks a bit hacky, but it's the only way to get the FileList type in SSR mode that i could think of.
    files: z
      .unknown()
      .optional()
      .refine((files) => files === undefined || files instanceof FileList, {
        message: 'Files must be a FileList or undefined'
      })
  })
  .refine(
    (data) => {
      // Either content must have text or files must be provided
      return (
        (data.content?.trim().length ?? 0) > 0 ||
        (data.files && data.files.length > 0)
      );
    },
    {
      message: 'Either text content or files must be provided'
    }
  );

const ChatInput = () => {
  // eslint-disable-next-line react-compiler/react-compiler
  'use no memo';

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFlutterWebViewRef = useRef<boolean>(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef<boolean>(false);

  const { sendMessage, status, stop } = useChatContext();
  const {
    session,
    canConnect,
    connect,
    disconnect: _disconnect,
    connectionState,
    isEnabled,
    isLoading: isRealTimeLoading,
    isMuted,
    setIsMuted,
    isAgentTurn,
    interrupt
  } = useRealTime();

  const {
    reset,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting, isValid, isSubmitSuccessful }
  } = useZodForm(schema);

  const watchedFiles = watch('files');

  const submitHandler: SubmitHandler<z.infer<typeof schema>> = (data) => {
    if (connectionState === 'connected' && session) {
      session.sendMessage({
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text: data.content ?? '' }]
      });

      return;
    }

    if (data.files && data.files.length > 0) {
      void sendMessage({
        text: `[uploaded files: ${Array.from(data.files)
          .map((file) => file.name)
          .join(', ')}]`,
        files: data.files
      });
      return;
    }

    void sendMessage({
      text: data.content ?? '',
      files: data.files
    });
  };

  const { ref: textareaFormRef, ...rest } = register('content');
  const { ref: fileInputFormRef, ...fileInputProps } = register('files');

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent ?? '';
      // Flutter WebViews often add these markers to the UA string.
      isFlutterWebViewRef.current = /Flutter|InAppWebView|\bwv\b/i.test(ua);
    }
  }, []);

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset();
      if (isFlutterWebViewRef.current) {
        // Flutter WebView: blur to keep the soft keyboard closed after send.
        textareaRef.current?.blur();
      } else {
        textareaRef.current?.focus();
      }
    }
  }, [isSubmitSuccessful, reset]);

  const isLoading =
    isSubmitting || status === 'submitted' || status === 'streaming';

  const isInputDisabled = isSubmitting || status === 'submitted';

  const isStreaming = status === 'streaming';

  useEffect(() => {
    if (!isStreaming) {
      textareaRef.current?.focus();
    }
  }, [isStreaming]);

  return (
    <motion.div
      className="sticky bottom-3 left-0 right-0 px-3 md:bottom-5 md:px-5"
      initial={{ opacity: 0, y: '50%', filter: 'blur(5px)' }}
      animate={{
        opacity: 1,
        y: 0,

        filter: 'blur(0px)',
        transition: {
          delay: 0.3,
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1]
        }
      }}
    >
      <div className="bg-surface-primary shadow-short mx-auto w-full max-w-4xl space-y-2.5 overflow-clip rounded-2xl bg-clip-padding contain-inline-size">
        <div className="space-y-5 px-5 pt-5">
          {watchedFiles && watchedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Array.from(watchedFiles).map((file, index) => {
                return (
                  <div
                    key={index}
                    className="bg-fill-muted relative flex items-center gap-1.5 rounded-lg p-1 text-sm"
                  >
                    <FileThumbnail
                      file={file}
                      size="sm"
                      className="bg-fill-brand text-text-brand-on-fill"
                      iconClassName="!size-5"
                    />
                    <span className="max-w-[200px] truncate">{file.name}</span>
                    <Button
                      type="button"
                      size="xs"
                      variant="ghost"
                      shape="circle"
                      className="!bg-background-static-alpha-80% !absolute -right-1.5 -top-1.5 backdrop-blur-sm"
                      onClick={() => {
                        const dt = new DataTransfer();

                        Array.from(watchedFiles).forEach((f, i) => {
                          if (i !== index) dt.items.add(f);
                        });

                        setValue(
                          'files',
                          dt.files.length > 0 ? dt.files : undefined
                        );
                      }}
                    >
                      <ButtonContent>
                        <Icon icon={IconX} size="sm" />
                      </ButtonContent>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          <div
            className="cursor-text data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50"
            data-disabled={isInputDisabled}
            onClick={() => {
              textareaRef.current?.focus();
            }}
          >
            <TextareaAutosize
              disabled={isInputDisabled}
              autoFocus
              className="decoration-none placeholder:text-text-muted text-text-primary w-full resize-none focus:outline-none"
              ref={(e) => {
                textareaFormRef(e);
                textareaRef.current = e;
              }}
              onKeyDown={(e) => {
                if (!isStreaming && !e.shiftKey && e.key === 'Enter') {
                  e.preventDefault();
                  void handleSubmit(submitHandler)();
                }
              }}
              minRows={1}
              maxRows={6}
              placeholder="Ask me anything..."
              {...rest}
            />
          </div>
        </div>

        <input
          type="file"
          ref={(e) => {
            fileInputFormRef(e);
            fileInputRef.current = e;
          }}
          {...fileInputProps}
          multiple
          accept="image/*,video/*,audio/*,application/pdf,text/*"
          className="hidden"
        />

        <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5">
          <div className="flex items-center gap-2">
            <Button
              shape="circle"
              size="lg"
              type="button"
              colorRole="brand"
              isDisabled={isInputDisabled}
              onClick={() => fileInputRef.current?.click()}
            >
              <ButtonContent>
                <Icon icon={IconPlus} size="lg" className="stroke-current" />
              </ButtonContent>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {isEnabled && (
              <Button
                shape="circle"
                size="lg"
                type="button"
                colorRole="brand"
                isDisabled={
                  isLoading ||
                  connectionState === 'connecting' ||
                  connectionState === 'disconnecting' ||
                  !isEnabled ||
                  (connectionState === 'disconnected' && !canConnect) ||
                  isRealTimeLoading
                }
                onPointerDown={() => {
                  longPressTriggeredRef.current = false;
                  if (connectionState === 'connected') {
                    longPressTimerRef.current = setTimeout(() => {
                      longPressTriggeredRef.current = true;
                      _disconnect();
                    }, 700);
                  }
                }}
                onPointerUp={() => {
                  if (longPressTimerRef.current) {
                    clearTimeout(longPressTimerRef.current);
                    longPressTimerRef.current = null;
                  }
                }}
                onPointerLeave={() => {
                  if (longPressTimerRef.current) {
                    clearTimeout(longPressTimerRef.current);
                    longPressTimerRef.current = null;
                  }
                }}
                onClick={() => {
                  console.log('🎤 Microphone button clicked:', connectionState);

                  if (longPressTriggeredRef.current) {
                    // Long-press already handled disconnect; ignore click
                    longPressTriggeredRef.current = false;
                    return;
                  }

                  if (connectionState === 'connected' && session) {
                    setIsMuted(!isMuted);
                  } else if (connectionState === 'disconnected') {
                    connect();
                  }
                }}
              >
                <ButtonContent>
                  <Icon
                    icon={
                      connectionState === 'connecting' ||
                      connectionState === 'disconnecting' ||
                      isRealTimeLoading
                        ? IconSpinner
                        : connectionState === 'connected'
                          ? isMuted
                            ? IconMicrophoneOff
                            : IconMicrophoneFilled
                          : IconMicrophone
                    }
                    size="lg"
                    className={
                      connectionState === 'connecting' ||
                      connectionState === 'disconnecting' ||
                      isRealTimeLoading
                        ? 'text-current'
                        : 'stroke-current'
                    }
                  />
                </ButtonContent>
              </Button>
            )}
            <Button
              shape="circle"
              size="lg"
              type="submit"
              colorRole="brand"
              isDisabled={
                (!isStreaming &&
                  (!isValid || isSubmitting) &&
                  !(
                    connectionState === 'connected' &&
                    isAgentTurn &&
                    session
                  )) ||
                status === 'submitted'
              }
              onClick={
                isStreaming
                  ? stop
                  : connectionState === 'connected' && isAgentTurn && session
                    ? () => interrupt()
                    : handleSubmit(submitHandler)
              }
            >
              <ButtonContent>
                <Icon
                  icon={
                    connectionState === 'connecting' ||
                    connectionState === 'disconnecting' ||
                    isRealTimeLoading
                      ? IconSpinner
                      : isLoading && !isStreaming
                        ? IconSpinner
                        : isStreaming ||
                            (connectionState === 'connected' &&
                              isAgentTurn &&
                              session)
                          ? IconPlayerStop
                          : IconSend
                  }
                  size="lg"
                  className={
                    connectionState === 'connecting' ||
                    connectionState === 'disconnecting' ||
                    isRealTimeLoading ||
                    (isLoading && !isStreaming)
                      ? 'text-current'
                      : 'stroke-current'
                  }
                />
              </ButtonContent>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatInput;
