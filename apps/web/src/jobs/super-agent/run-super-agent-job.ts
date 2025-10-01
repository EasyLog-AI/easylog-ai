import { AbortTaskRunError, logger, schemaTask } from '@trigger.dev/sdk';
import {
  convertToModelMessages,
  generateId,
  generateText,
  stepCountIs,
  tool
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

export const runSuperAgentJob = schemaTask({
  id: 'run-super-agent',
  schema: z.object({
    superAgentId: z.string(),
    chatId: z.string(),
    userId: z.string()
  }),
  run: async ({ superAgentId, chatId, userId }) => {
    let skipReason: string | null = null;
    const writeChatMessages: string[] = [];

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

You are a super agent that runs autonomously on a scheduled interval (${superAgent.cronExpression}) to analyze user conversations and perform background tasks.

## Your Role
<start_of_role_instructions>
${superAgent.prompt}
</end_of_role_instructions>

## Execution Context

### Schedule Information
- **Cron Expression**: ${superAgent.cronExpression}
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

## Your Mission
Silently monitor and analyze conversations, storing insights in your scratchpad. Only surface to the user when you have something genuinely helpful to contribute based on patterns, missed opportunities, or important follow-ups you've identified.
`;

    const result = await generateText({
      model: openrouter(superAgent.model, {
        reasoning: {
          enabled: superAgent.reasoning,
          effort: superAgent.reasoningEffort
        }
      }),
      system: systemPrompt,
      messages: convertToModelMessages(chat.messages),
      stopWhen: [
        stepCountIs(20),
        ({ steps }) => {
          const last = steps.at(-1);

          if (!last) return false;

          const toolResult = last.toolResults?.find(
            (t) => t.toolName === 'skip'
          );

          if (!toolResult || !toolResult.output) return false;

          return z
            .object({
              success: z.boolean()
            })
            .parse(toolResult.output).success;
        }
      ],
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
        skipIteration: tool({
          description: 'Skip this super agent iteration',
          inputSchema: z.object({
            reason: z.string()
          }),
          execute: async ({ reason }) => {
            logger.info(`Skipping super agent iteration because: ${reason}`);

            skipReason = reason;

            return {
              success: true
            };
          }
        }),
        writeChatMessage: tool({
          description: 'Write a message to the chat',
          inputSchema: z.object({
            message: z.string()
          }),
          execute: async ({ message }) => {
            writeChatMessages.push(message);
            return 'Message will be written to chat when the super agent is finished';
          }
        }),
        createMemory: toolCreateMemory(userId),
        deleteMemory: toolDeleteMemory(),
        executeSql: toolExecuteSQL(),
        searchKnowledgeBase: toolSearchKnowledgeBase({
          agentId: chat.agentId
        })
      }
    });

    logger.info(result.text);
    logger.info(JSON.parse(JSON.stringify(result, null, 2)));
    logger.info(`Response ID: ${result.response.id}`);

    const lastMessage = result.response.messages
      .filter((message) => message.role === 'assistant')
      .at(-1);

    if (!lastMessage) {
      throw new AbortTaskRunError('Last message not found, this is unexpected');
    }

    if (skipReason) {
      logger.info(`Skipping super agent iteration because: ${skipReason}`);
      return;
    }

    if (writeChatMessages.length > 0) {
      logger.info(`Writing ${writeChatMessages.length} messages to chat`);

      await db
        .update(chats)
        .set({
          messages: [
            ...chat.messages,
            {
              id: generateId(),
              role: 'assistant',
              parts: writeChatMessages.map((message) => ({
                type: 'text',
                text: message
              }))
            }
          ]
        })
        .where(eq(chats.id, chatId));
    }
  }
});
