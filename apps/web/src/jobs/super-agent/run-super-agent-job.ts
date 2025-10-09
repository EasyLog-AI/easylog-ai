import { AbortTaskRunError, logger, schemaTask } from '@trigger.dev/sdk';
import {
  UIDataTypes,
  UIMessage,
  UITools,
  convertToModelMessages,
  generateId,
  generateText,
  stepCountIs,
  tool,
  validateUIMessages
} from 'ai';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import toolCreateMemory from '@/app/_chats/tools/core/toolCreateMemory';
import toolDeleteMemory from '@/app/_chats/tools/core/toolDeleteMemory';
import toolExecuteSQL from '@/app/_chats/tools/execute-sql/toolExecuteSQL';
import toolSearchKnowledgeBase from '@/app/_chats/tools/knowledge-base/toolSearchKnowledgeBase';
import db from '@/database/client';
import {
  chats,
  scratchpadMessages as scratchpadMessagesTable
} from '@/database/schema';
import openrouter from '@/lib/ai-providers/openrouter';
import tryCatch from '@/utils/try-catch';

export const runSuperAgentJob = schemaTask({
  id: 'run-super-agent',
  schema: z.object({
    superAgentId: z.string(),
    chatId: z.string(),
    userId: z.string()
  }),
  retry: {
    maxAttempts: 1
  },
  queue: {
    concurrencyLimit: 5
  },
  run: async ({ superAgentId, chatId, userId }) => {
    const skipReason: string | null = null;
    const writeChatMessageParts: string[] = [];

    const [superAgent, chat, scratchpadMessages] = await Promise.all([
      db.query.superAgents.findFirst({
        where: {
          id: superAgentId
        },
        with: {
          agent: true
        }
      }),
      db.query.chats.findFirst({
        where: {
          id: chatId
        },
        with: {
          agent: true,
          user: {
            with: {
              memories: true
            }
          }
        }
      }),
      db.query.scratchpadMessages.findMany({
        where: {
          superAgentId: superAgentId,
          userId: userId
        }
      })
    ]);

    if (!superAgent) {
      throw new AbortTaskRunError('Super agent not found');
    }

    if (!chat) {
      throw new AbortTaskRunError('Chat not found');
    }

    // Construct comprehensive system prompt
    const systemPrompt = `# Super Agent System

You are a super agent that runs autonomously on a schedule to analyze user conversations and perform background tasks.

## Your Role
<start_of_role_instructions>
${superAgent.prompt}
</end_of_role_instructions>

## Execution Context

### Time Information
- **Current Time**: ${new Date().toISOString()}

### User Information
- **User ID**: ${userId}
- **User Name**: ${chat.user.name}
- **User Email**: ${chat.user.email}

### Chat Context
- **Chat ID**: ${chatId}
- **Agent**: ${superAgent.agent.name}
- **Total Messages**: ${chat.messages.length}

### Available Data

**User Memories** (${chat.user.memories.length} total):
${chat.user.memories.length > 0 ? chat.user.memories.map((m) => `- ${m.content}`).join('\n') : 'No memories stored yet.'}

**Scratchpad Messages** (${scratchpadMessages.length} total - your private notes from previous runs):
${scratchpadMessages.length > 0 ? scratchpadMessages.map((m) => `[${new Date(m.createdAt).toISOString()}] ${m.message}`).join('\n') : 'No scratchpad messages yet.'}

## Available Tools

### Analysis & Decision Tools
- **skipIteration(reason)**: Skip this run if no action is needed. Always provide a clear reason.
- **writeScratchpadMessage(message)**: Store private notes for your next run. Use this to track insights, patterns, or reminders across iterations.
- **deleteScratchpadMessage(messageId)**: Clean up outdated scratchpad notes.
- **createMemory(memory)**: Create a memory for the user. This is an AI-generated memory that can be used for future context. This can be used to add information to the user's memories.
- **deleteMemory(memoryId)**: Delete a memory for the user.

### Communication Tools
- **writeChatMessage(message)**: Add a message to the user's chat. Use sparingly and only when you have something valuable to share. IMPORTANT: Always write in the same language as the conversation (match the language of the recent messages).

### Data Access Tools
- **executeSql(query)**: Execute SQL queries for data analysis.
- **searchKnowledgeBase(query)**: Search the agent's knowledge base for relevant information.

## Guidelines

1. **Analyze First**: Review the conversation history, user memories, and your scratchpad notes to understand context.

2. **Decide Action**: Determine if this iteration requires action:
   - If no action needed → call skipIteration() with clear reasoning
   - If insights found → update scratchpad for future reference
   - If user would benefit → write a chat message

3. **Be Proactive But Not Intrusive**:
   - Look for patterns, missed questions, or opportunities to help
   - Only message the user when you have genuine value to add
   - Use scratchpad to track observations without bothering the user

4. **Maintain Context**: Use scratchpad messages to maintain state between runs. This is YOUR memory across iterations.

5. **Be Concise**: If you write to chat, be helpful and brief. Users don't know you're a background process. Act like your the assistant in the conversation.

6. **Follow Role Instructions**: If your role instructions within <start_of_role_instructions></end_of_role_instructions> tell you to "add message to the chat" or similar, you MUST use the writeChatMessage tool to do so.

## Output Format

**CRITICAL**: You MUST provide text output along with your tool calls. Your text output should be a concise summary (2-4 sentences) of your analysis. Include:
- What you observed in the conversation
- What actions you took (tools called) and why

Example: "Analyzed the last 5 messages. User asked about pricing but no response was given. No urgent action needed. Called skipIteration because conversation is still active and recent."

This summary is for logging/debugging purposes and helps track the super agent's behavior over time. **Do NOT just call tools without providing this text summary.**

## Your Mission
Silently monitor and analyze conversations, storing insights in your scratchpad. Only surface to the user when you have something genuinely helpful to contribute based on patterns, missed opportunities, or important follow-ups you've identified.
`;

    logger.info(`System prompt: ${systemPrompt}`);

    logger.info(`Messages: ${JSON.stringify(chat.messages, null, 2)}`);

    logger.info(
      `User memories: ${JSON.stringify(chat.user.memories, null, 2)}`
    );

    logger.info(
      `Scratchpad messages: ${JSON.stringify(scratchpadMessages, null, 2)}`
    );

    const validatedMessages = await validateUIMessages({
      messages: chat.messages
    });

    logger.info(
      `Validated messages: ${JSON.stringify(validatedMessages, null, 2)}`
    );

    const previousMessages = convertToModelMessages(chat.messages, {
      ignoreIncompleteToolCalls: true
    }).flatMap((message) => ({
      role: message.role,
      content:
        typeof message.content === 'string'
          ? message.content
          : message.content
              .map((content) =>
                content.type === 'text'
                  ? content.text
                  : content.type === 'tool-call'
                    ? JSON.stringify({
                        name: content.toolName,
                        input: content.input
                      })
                    : content.type === 'tool-result'
                      ? JSON.stringify({
                          name: content.toolName,
                          output: content.output
                        })
                      : null
              )
              .filter(Boolean)
              .join('\n')
    }));

    logger.info(
      `Previous messages: ${JSON.stringify(previousMessages, null, 2)}`
    );

    const [result, error] = await tryCatch(
      generateText({
        model: openrouter(superAgent.model, {
          reasoning: {
            enabled: superAgent.reasoning,
            effort: superAgent.reasoningEffort
          }
        }),
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `<previous_messages>
-${previousMessages.map((message) => `${message.role}: ${message.content}`).join('\n-')}
</previous_messages>`
          }
        ],
        stopWhen: [stepCountIs(20)],
        tools: {
          writeScratchpadMessage: tool({
            description: 'Write a message to the scratchpad',
            inputSchema: z.object({
              message: z.string()
            }),
            execute: async ({ message }) => {
              await db.insert(scratchpadMessagesTable).values({
                superAgentId: superAgentId,
                userId: userId,
                message: message
              });

              return 'Message written to scratchpad';
            }
          }),
          deleteScratchpadMessage: tool({
            description: 'Delete a message from the scratchpad',
            inputSchema: z.object({
              messageId: z.string()
            }),
            execute: async ({ messageId }) => {
              await db
                .delete(scratchpadMessagesTable)
                .where(eq(scratchpadMessagesTable.id, messageId));

              return 'Message deleted from scratchpad';
            }
          }),
          writeChatMessagePart: tool({
            description:
              'Write a message part to the chat. IMPORTANT: Only call this tool once per iteration. If you have multiple things to say, combine them into a single message.',
            inputSchema: z.object({
              message: z.string()
            }),
            execute: async ({ message }) => {
              writeChatMessageParts.push(message);
              return 'Message will be written to chat when the super agent is finished.';
            }
          }),
          createMemory: toolCreateMemory(userId),
          deleteMemory: toolDeleteMemory(),
          executeSql: toolExecuteSQL(),
          searchKnowledgeBase: toolSearchKnowledgeBase({
            agentId: chat.agentId
          })
        }
      })
    );

    if (error) {
      logger.error(`Error: ${error}`);
      throw error;
    }

    logger.info(`Result text: ${result.text}`);

    logger.info(`Response ID: ${result.response.id}`);

    result.reasoning.forEach((reasoning, index) => {
      logger.info(`Reasoning ${index + 1}: ${reasoning.text}`);
    });

    if (skipReason) {
      logger.info(`Skipping super agent iteration because: ${skipReason}`);
      return;
    }

    if (writeChatMessageParts.length === 0) {
      logger.info('No messages to write to chat');
      return;
    }

    logger.info(
      `Writing ${writeChatMessageParts.length} message parts to chat`,
      {
        writeChatMessageParts
      }
    );

    const newMessage: UIMessage<unknown, UIDataTypes, UITools> =
      chat.messages.at(-1)?.role === 'assistant'
        ? chat.messages.at(-1)!
        : {
            id: generateId(),
            role: 'assistant',
            parts: []
          };

    newMessage.parts.push(
      ...writeChatMessageParts.map((message) => ({
        type: 'text' as const,
        text: message
      }))
    );

    logger.info(`New message`, JSON.parse(JSON.stringify(newMessage)));

    await db
      .update(chats)
      .set({
        messages: [...chat.messages.slice(0, -1), newMessage]
      })
      .where(eq(chats.id, chatId));
  }
});
