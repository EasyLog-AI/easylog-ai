import { AbortTaskRunError, logger, schemaTask } from '@trigger.dev/sdk';
import {
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
import toolExploreKnowledge from '@/app/_chats/tools/knowledge-base/toolExploreKnowledge';
import toolResearchKnowledge from '@/app/_chats/tools/knowledge-base/toolResearchKnowledge';
import toolSearchKnowledge from '@/app/_chats/tools/knowledge-base/toolSearchKnowledge';
import { ChatMessage } from '@/app/_chats/types';
import db from '@/database/client';
import {
  chats,
  scratchpadMessages as scratchpadMessagesTable
} from '@/database/schema';
import createModel from '@/lib/ai-providers/create-model';
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
          agent: {
            with: {
              roles: true
            }
          },
          activeRole: true,
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

    const agentMemories =
      (chat.user.memories ?? []).filter(
        (memory) => memory.agentId === chat.agentId
      );

    const activeRole =
      chat.activeRole ?? chat.agent.roles.find((r) => r.isDefault);

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

**User Memories** (${agentMemories.length} total):
${agentMemories.length > 0 ? agentMemories.map((m) => `- ${m.content}`).join('\n') : 'No memories stored yet.'}

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
- **searchKnowledge(query)**: Search for relevant knowledge items using hybrid vector + keyword search.
- **researchKnowledge(knowledgeId, question)**: Research a specific knowledge item to answer a question using a recursive AI agent.
- **exploreKnowledge(question)**: Automatically search and research knowledge to answer a question (combines search + research).

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

    logger.info(`User memories: ${JSON.stringify(agentMemories, null, 2)}`);

    logger.info(
      `Scratchpad messages: ${JSON.stringify(scratchpadMessages, null, 2)}`
    );

    const chatMessages = chat.messages as ChatMessage[];

    const validatedMessages = await validateUIMessages<ChatMessage>({
      messages: chatMessages
    });

    logger.info(
      `Validated messages: ${JSON.stringify(validatedMessages, null, 2)}`
    );

    const previousMessages = convertToModelMessages(chatMessages, {
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
        ...createModel(superAgent.provider, superAgent.model, {
          reasoning: {
            enabled: superAgent.reasoning,
            effort: superAgent.reasoningEffort
          },
          cacheControl: {
            enabled: superAgent.cacheControl
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
          createMemory: toolCreateMemory({
            userId,
            agentId: chat.agentId
          }),
          deleteMemory: toolDeleteMemory({
            userId,
            agentId: chat.agentId
          }),
          executeSql: toolExecuteSQL(),
          searchKnowledge: toolSearchKnowledge(
            {
              agentId: chat.agentId,
              roleId: activeRole?.id
            },
            undefined
          ),
          researchKnowledge: toolResearchKnowledge(
            {
              agentId: chat.agentId,
              roleId: activeRole?.id
            },
            undefined
          ),
          exploreKnowledge: toolExploreKnowledge({
            agentId: chat.agentId,
            roleId: activeRole?.id
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

    type TextPart = Extract<ChatMessage['parts'][number], { type: 'text' }>;

    const lastMessage = chatMessages.at(-1);
    const baseMessage: ChatMessage =
      lastMessage && lastMessage.role === 'assistant'
        ? {
            ...lastMessage,
            parts: [...lastMessage.parts]
          }
        : {
            id: generateId(),
            role: 'assistant',
            parts: []
          };

    const newParts: TextPart[] = writeChatMessageParts.map((message) => ({
      type: 'text',
      text: message
    }));

    baseMessage.parts.push(...newParts);

    logger.info(`New message`, JSON.parse(JSON.stringify(baseMessage)));

    const updatedMessages =
      lastMessage && lastMessage.role === 'assistant'
        ? [...chatMessages.slice(0, -1), baseMessage]
        : [...chatMessages, baseMessage];

    await db
      .update(chats)
      .set({
        messages: updatedMessages
      })
      .where(eq(chats.id, chatId));
  }
});
