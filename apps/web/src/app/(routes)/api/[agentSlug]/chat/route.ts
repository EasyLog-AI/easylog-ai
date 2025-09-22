import * as Sentry from '@sentry/nextjs';
import {
  UIMessage,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  hasToolCall,
  stepCountIs,
  streamText,
  tool,
  validateUIMessages
} from 'ai';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import z from 'zod';

import getCurrentUser from '@/app/_auth/data/getCurrentUser';
import toolCreateChart from '@/app/_chats/tools/charts/toolCreateChart';
import toolCreateMultipleAllocations from '@/app/_chats/tools/easylog-backend/toolCreateMultipleAllocations';
import toolCreatePlanningPhase from '@/app/_chats/tools/easylog-backend/toolCreatePlanningPhase';
import toolCreatePlanningProject from '@/app/_chats/tools/easylog-backend/toolCreatePlanningProject';
import toolDeleteAllocation from '@/app/_chats/tools/easylog-backend/toolDeleteAllocation';
import toolGetDataSources from '@/app/_chats/tools/easylog-backend/toolGetDataSources';
import toolGetPlanningPhase from '@/app/_chats/tools/easylog-backend/toolGetPlanningPhase';
import toolGetPlanningPhases from '@/app/_chats/tools/easylog-backend/toolGetPlanningPhases';
import toolGetPlanningProject from '@/app/_chats/tools/easylog-backend/toolGetPlanningProject';
import toolGetPlanningProjects from '@/app/_chats/tools/easylog-backend/toolGetPlanningProjects';
import toolGetProjectsOfResource from '@/app/_chats/tools/easylog-backend/toolGetProjectsOfResource';
import toolGetResourceGroups from '@/app/_chats/tools/easylog-backend/toolGetResourceGroups';
import toolGetResources from '@/app/_chats/tools/easylog-backend/toolGetResources';
import toolUpdateMultipleAllocations from '@/app/_chats/tools/easylog-backend/toolUpdateMultipleAllocations';
import toolUpdatePlanningPhase from '@/app/_chats/tools/easylog-backend/toolUpdatePlanningPhase';
import toolUpdatePlanningProject from '@/app/_chats/tools/easylog-backend/toolUpdatePlanningProject';
import toolExecuteSQL from '@/app/_chats/tools/execute-sql/toolExecuteSQL';
import toolLoadDocument from '@/app/_chats/tools/knowledge-base/toolLoadDocument';
import toolSearchKnowledgeBase from '@/app/_chats/tools/knowledge-base/toolSearchKnowledgeBase';
import toolAnswerMultipleChoice from '@/app/_chats/tools/multiple-choice/toolAnswerMultipleChoice';
import toolCreateMultipleChoice from '@/app/_chats/tools/multiple-choice/toolCreateMultipleChoice';
import db from '@/database/client';
import { chats, memories } from '@/database/schema';
import openrouter from '@/lib/ai-providers/openrouter';
import isUUID from '@/utils/is-uuid';

export const maxDuration = 800;

export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ agentSlug: string }> }
) => {
  const { agentSlug } = await params;

  const user = await getCurrentUser(req.headers);

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { message, id }: { message: UIMessage; id: string } = await req.json();

  const chat = await db.query.chats.findFirst({
    where: {
      id,
      userId: user.id
    },
    with: {
      agent: {
        with: {
          roles: true
        }
      },
      activeRole: true
    }
  });

  if (
    !chat ||
    (isUUID(agentSlug) && chat.agentId !== agentSlug) ||
    (!isUUID(agentSlug) && chat.agent.slug !== agentSlug)
  ) {
    return new NextResponse('Chat not found', { status: 404 });
  }

  const validatedMessages = await validateUIMessages({
    messages: [...chat.messages, message]
  });

  const activeRole =
    chat.activeRole ?? chat.agent.roles.find((r) => r.isDefault);

  const masterTemplate = `
  # SYSTEM INSTRUCTIONS
  
  ## 1. CONTEXT
  - User: ${user.name ?? 'Unknown'}
  - Timestamp: ${new Date().toISOString()}
  
  ## 2. USER MEMORIES
  This is the information you have stored about the user. Use it to personalize your responses.
  
  ${
    user.memories && user.memories.length > 0
      ? user.memories
          .map((mem) => `- [ID: ${mem.id}] ${mem.content}`)
          .join('\n')
      : 'You have not stored any memories about this user yet.'
  }
  
  ## 3. CORE TOOLS
  These tools are always available. Other tools may be provided depending on the context.
  
  | Tool Signature | Description & When to Use |
  | :--- | :--- |
  | \`clearChat()\` | Clears the chat history. Use for user requests like "start over" or "reset". |
  | \`changeRole(roleName: string)\` | Changes your active persona. **MUST** use when the user's request aligns with a persona in the "AVAILABLE ROLES" section below. The \`roleName\` must be an **exact match** from the list. |
  | \`createMemory(memory: string)\` | Stores a persistent fact about the user. **Use when the user shares definitive information about themselves (e.g., "I am a developer," "My goal is to learn Spanish").** Also use when explicitly asked to remember something. Keep memories concise. |
  | \`deleteMemory(memoryId: string)\` | Deletes a specific fact. Use the ID provided in the "USER MEMORIES" section. Use when asked to forget something or when information is outdated. |
  
  ## 4. AVAILABLE ROLES
  Consult this list to decide when to call the \`changeRole\` tool.
  
  ${
    chat.agent.roles && chat.agent.roles.length > 0
      ? chat.agent.roles
          .map((role) => `- **${role.name}**: ${role.description}`)
          .join('\n')
      : 'No special roles are available for this agent.'
  }
  
  ## 5. INSTRUCTION HIERARCHY & PERSONA
  Your behavior is governed by the following hierarchy. This is a critical rule.
  
  1.  **Primary Directive: ACTIVE ROLE.** Your instructions for this role are below. They **OVERRIDE** the Core Prompt.
      - **Role Name:** \`${activeRole?.name ?? 'Default'}\`
      - **Instructions:**
        <start_of_role_instructions>
        ${activeRole?.instructions ?? 'n/a'}
        </end_of_role_instructions>
  
  2.  **Fallback: CORE PROMPT.** This is your general baseline personality. Use it only when no specific role instruction applies.
      <start_of_core_prompt>
      ${chat.agent.prompt}
      </start_of_core_prompt>
`;

  const promptWithContext = masterTemplate
    .replaceAll('{{user.name}}', user.name ?? 'Unknown')
    .replaceAll('{{agent.name}}', chat.agent.name)
    .replaceAll('{{role.name}}', activeRole?.name ?? 'default')
    .replaceAll('{{role.instructions}}', activeRole?.instructions ?? '')
    .replaceAll('{{role.model}}', activeRole?.model ?? 'gpt-5')
    .replaceAll('{{now}}', new Date().toISOString());

  const model = activeRole?.model ?? chat.agent.defaultModel;

  const reasoning = {
    enabled: activeRole?.reasoning ?? chat.agent.defaultReasoning,
    effort: activeRole?.reasoningEffort ?? chat.agent.defaultReasoningEffort
  };

  const messages = [...(chat.messages as UIMessage[]), message];

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const result = streamText({
        model: openrouter(model, {
          reasoning
        }),
        system: promptWithContext,
        messages: convertToModelMessages(validatedMessages),
        tools: {
          createChart: toolCreateChart(writer),
          getDatasources: toolGetDataSources(user.id),
          getPlanningProjects: toolGetPlanningProjects(user.id),
          getPlanningProject: toolGetPlanningProject(user.id),
          createPlanningProject: toolCreatePlanningProject(user.id),
          updatePlanningProject: toolUpdatePlanningProject(user.id),
          getPlanningPhases: toolGetPlanningPhases(user.id),
          getPlanningPhase: toolGetPlanningPhase(user.id),
          updatePlanningPhase: toolUpdatePlanningPhase(user.id),
          createPlanningPhase: toolCreatePlanningPhase(user.id),
          getResources: toolGetResources(user.id),
          getProjectsOfResource: toolGetProjectsOfResource(user.id),
          getResourceGroups: toolGetResourceGroups(user.id),
          createMultipleAllocations: toolCreateMultipleAllocations(user.id),
          updateMultipleAllocations: toolUpdateMultipleAllocations(user.id),
          deleteAllocation: toolDeleteAllocation(user.id),
          executeSql: toolExecuteSQL(writer),
          searchKnowledgeBase: toolSearchKnowledgeBase(
            {
              agentId: chat.agentId
            },
            writer
          ),
          loadDocument: toolLoadDocument(),
          clearChat: tool({
            description: 'Clear the chat',
            inputSchema: z.object({}),
            execute: async () => {
              await db.insert(chats).values({
                agentId: chat.agentId,
                userId: user.id
              });

              return 'Chat cleared';
            }
          }),
          changeRole: tool({
            description: 'Change the active role',
            inputSchema: z.object({
              roleName: z.string()
            }),
            execute: async (input) => {
              const role = chat.agent.roles.find(
                (role) => role.name === input.roleName
              );

              if (!role) {
                return 'Role not found';
              }

              await db.update(chats).set({
                activeRoleId: role.id
              });

              return `Role changed to ${role.name}`;
            }
          }),
          createMemory: tool({
            description: 'Create a memory',
            inputSchema: z.object({
              memory: z.string()
            }),
            execute: async (input) => {
              await db.insert(memories).values({
                userId: user.id,
                content: input.memory
              });

              return 'Memory created';
            }
          }),
          deleteMemory: tool({
            description: 'Delete a memory',
            inputSchema: z.object({
              memoryId: z.string()
            }),
            execute: async (input) => {
              await db.delete(memories).where(eq(memories.id, input.memoryId));

              return 'Memory deleted';
            }
          }),
          createMultipleChoice: toolCreateMultipleChoice(
            {
              chatId: chat.id
            },
            writer
          ),
          answerMultipleChoice: toolAnswerMultipleChoice({
            chatId: chat.id
          })
        },
        stopWhen: [stepCountIs(20), hasToolCall('createMultipleChoice')]
      });

      writer.write({
        type: 'start',
        messageId: generateId()
      });

      writer.merge(result.toUIMessageStream({ sendStart: false }));
    },
    originalMessages: messages,
    onFinish: async ({ messages }) => {
      await db
        .update(chats)
        .set({
          messages
        })
        .where(eq(chats.id, id));
    },
    onError: (error) => {
      console.error(error);
      Sentry.captureException(error);
      return 'An error occurred';
    }
  });

  return createUIMessageStreamResponse({ stream });
};
