import * as Sentry from '@sentry/nextjs';
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  hasToolCall,
  stepCountIs,
  streamText,
  validateUIMessages
} from 'ai';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import getCurrentUser from '@/app/_auth/data/getCurrentUser';
import multipleChoiceSchema from '@/app/_chats/schemas/multipleChoiceSchema';
import researchSchema from '@/app/_chats/schemas/researchSchema';
import {
  barChartSchema,
  lineChartSchema,
  pieChartSchema,
  stackedBarChartSchema
} from '@/app/_chats/tools/charts/schemas';
import toolCreateBarChart from '@/app/_chats/tools/charts/toolCreateBarChart';
import toolCreateLineChart from '@/app/_chats/tools/charts/toolCreateLineChart';
import toolCreatePieChart from '@/app/_chats/tools/charts/toolCreatePieChart';
import toolCreateStackedBarChart from '@/app/_chats/tools/charts/toolCreateStackedBarChart';
import toolChangeRole from '@/app/_chats/tools/core/toolChangeRole';
import toolClearChat from '@/app/_chats/tools/core/toolClearChat';
import toolCreateMemory from '@/app/_chats/tools/core/toolCreateMemory';
import toolDeleteMemory from '@/app/_chats/tools/core/toolDeleteMemory';
import toolCreateFollowUp from '@/app/_chats/tools/easylog-backend/toolCreateFollowUp';
import toolCreateFollowUpEntry from '@/app/_chats/tools/easylog-backend/toolCreateFollowUpEntry';
import toolCreateForm from '@/app/_chats/tools/easylog-backend/toolCreateForm';
import toolCreateMultipleAllocations from '@/app/_chats/tools/easylog-backend/toolCreateMultipleAllocations';
import toolCreatePlanningPhase from '@/app/_chats/tools/easylog-backend/toolCreatePlanningPhase';
import toolCreatePlanningProject from '@/app/_chats/tools/easylog-backend/toolCreatePlanningProject';
import toolCreateSubmission from '@/app/_chats/tools/easylog-backend/toolCreateSubmission';
import toolDeleteAllocation from '@/app/_chats/tools/easylog-backend/toolDeleteAllocation';
import toolDeleteFollowUp from '@/app/_chats/tools/easylog-backend/toolDeleteFollowUp';
import toolDeleteFollowUpEntry from '@/app/_chats/tools/easylog-backend/toolDeleteFollowUpEntry';
import toolDeleteForm from '@/app/_chats/tools/easylog-backend/toolDeleteForm';
import toolDeleteSubmission from '@/app/_chats/tools/easylog-backend/toolDeleteSubmission';
import toolGetDataSources from '@/app/_chats/tools/easylog-backend/toolGetDataSources';
import toolGetPlanningPhase from '@/app/_chats/tools/easylog-backend/toolGetPlanningPhase';
import toolGetPlanningPhases from '@/app/_chats/tools/easylog-backend/toolGetPlanningPhases';
import toolGetPlanningProject from '@/app/_chats/tools/easylog-backend/toolGetPlanningProject';
import toolGetPlanningProjects from '@/app/_chats/tools/easylog-backend/toolGetPlanningProjects';
import toolGetProjectsOfResource from '@/app/_chats/tools/easylog-backend/toolGetProjectsOfResource';
import toolGetResourceGroups from '@/app/_chats/tools/easylog-backend/toolGetResourceGroups';
import toolGetResources from '@/app/_chats/tools/easylog-backend/toolGetResources';
import toolListFollowUpCategories from '@/app/_chats/tools/easylog-backend/toolListFollowUpCategories';
import toolListFollowUpEntries from '@/app/_chats/tools/easylog-backend/toolListFollowUpEntries';
import toolListFollowUps from '@/app/_chats/tools/easylog-backend/toolListFollowUps';
import toolListForms from '@/app/_chats/tools/easylog-backend/toolListForms';
import toolListProjectForms from '@/app/_chats/tools/easylog-backend/toolListProjectForms';
import toolListSubmissionMedia from '@/app/_chats/tools/easylog-backend/toolListSubmissionMedia';
import toolListSubmissions from '@/app/_chats/tools/easylog-backend/toolListSubmissions';
import toolPrepareSubmission from '@/app/_chats/tools/easylog-backend/toolPrepareSubmission';
import toolShowFollowUp from '@/app/_chats/tools/easylog-backend/toolShowFollowUp';
import toolShowSubmissionMedia from '@/app/_chats/tools/easylog-backend/toolShowSubmissionMedia';
import toolShowFollowUpCategory from '@/app/_chats/tools/easylog-backend/toolShowFollowUpCategory';
import toolShowFollowUpEntry from '@/app/_chats/tools/easylog-backend/toolShowFollowUpEntry';
import toolShowForm from '@/app/_chats/tools/easylog-backend/toolShowForm';
import toolShowSubmission from '@/app/_chats/tools/easylog-backend/toolShowSubmission';
import toolUpdateFollowUp from '@/app/_chats/tools/easylog-backend/toolUpdateFollowUp';
import toolUpdateFollowUpEntry from '@/app/_chats/tools/easylog-backend/toolUpdateFollowUpEntry';
import toolUpdateForm from '@/app/_chats/tools/easylog-backend/toolUpdateForm';
import toolUpdateMultipleAllocations from '@/app/_chats/tools/easylog-backend/toolUpdateMultipleAllocations';
import toolUpdatePlanningPhase from '@/app/_chats/tools/easylog-backend/toolUpdatePlanningPhase';
import toolUpdatePlanningProject from '@/app/_chats/tools/easylog-backend/toolUpdatePlanningProject';
import toolUpdateSubmission from '@/app/_chats/tools/easylog-backend/toolUpdateSubmission';
import toolUploadSubmissionMedia from '@/app/_chats/tools/easylog-backend/toolUploadSubmissionMedia';
import toolExecuteSQL from '@/app/_chats/tools/execute-sql/toolExecuteSQL';
import toolLoadDocument from '@/app/_chats/tools/knowledge-base/toolLoadDocument';
import toolSearchKnowledgeBase from '@/app/_chats/tools/knowledge-base/toolSearchKnowledgeBase';
import toolAnswerMultipleChoice from '@/app/_chats/tools/multiple-choice/toolAnswerMultipleChoice';
import toolCreateMultipleChoice from '@/app/_chats/tools/multiple-choice/toolCreateMultipleChoice';
import toolGetAuditSubmissions from '@/app/_chats/tools/pqi-audits/toolGetAuditSubmissions';
import toolGetAuditTrends from '@/app/_chats/tools/pqi-audits/toolGetAuditTrends';
import toolGetObservationsAnalysis from '@/app/_chats/tools/pqi-audits/toolGetObservationsAnalysis';
import toolGetVehicleRanking from '@/app/_chats/tools/pqi-audits/toolGetVehicleRanking';
import { ChatMessage } from '@/app/_chats/types';
import getToolNamesFromCapabilities from '@/app/_chats/utils/getToolNamesFromCapabilities';
import db from '@/database/client';
import { chats } from '@/database/schema';
import createModel from '@/lib/ai-providers/create-model';
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

  const { message, id } = (await req.json()) as {
    message: ChatMessage;
    id: string;
  };

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

  const existingMessages = chat.messages as ChatMessage[];
  const combinedMessages: ChatMessage[] = [...existingMessages, message];

  const validatedMessages = await validateUIMessages<ChatMessage>({
    messages: combinedMessages,
    dataSchemas: {
      'bar-chart': barChartSchema,
      'line-chart': lineChartSchema,
      'stacked-bar-chart': stackedBarChartSchema,
      'pie-chart': pieChartSchema,
      research: researchSchema,
      'multiple-choice': multipleChoiceSchema
    }
    // TODO: Add tool calls to the messages
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
  const provider = activeRole?.provider ?? chat.agent.defaultProvider;

  const reasoning = {
    enabled: activeRole?.reasoning ?? chat.agent.defaultReasoning,
    effort: activeRole?.reasoningEffort ?? chat.agent.defaultReasoningEffort
  };

  const cacheControl = {
    enabled: activeRole?.cacheControl ?? chat.agent.defaultCacheControl
  };

  const stream = createUIMessageStream<ChatMessage>({
    execute: async ({ writer }) => {
      const allTools = {
        createBarChart: toolCreateBarChart(writer),
        createLineChart: toolCreateLineChart(writer),
        createPieChart: toolCreatePieChart(writer),
        createStackedBarChart: toolCreateStackedBarChart(writer),
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
        listFollowUps: toolListFollowUps(user.id),
        showFollowUp: toolShowFollowUp(user.id),
        createFollowUp: toolCreateFollowUp(user.id),
        updateFollowUp: toolUpdateFollowUp(user.id),
        deleteFollowUp: toolDeleteFollowUp(user.id),
        listFollowUpEntries: toolListFollowUpEntries(user.id),
        showFollowUpEntry: toolShowFollowUpEntry(user.id),
        createFollowUpEntry: toolCreateFollowUpEntry(user.id),
        updateFollowUpEntry: toolUpdateFollowUpEntry(user.id),
        deleteFollowUpEntry: toolDeleteFollowUpEntry(user.id),
        listFollowUpCategories: toolListFollowUpCategories(user.id),
        showFollowUpCategory: toolShowFollowUpCategory(user.id),
        listForms: toolListForms(user.id),
        showForm: toolShowForm(user.id),
        listProjectForms: toolListProjectForms(user.id),
        createForm: toolCreateForm(user.id),
        updateForm: toolUpdateForm(user.id),
        deleteForm: toolDeleteForm(user.id),
        listSubmissions: toolListSubmissions(user.id),
        showSubmission: toolShowSubmission(user.id),
        createSubmission: toolCreateSubmission(user.id),
        updateSubmission: toolUpdateSubmission(user.id),
        deleteSubmission: toolDeleteSubmission(user.id),
        listSubmissionMedia: toolListSubmissionMedia(user.id),
        showSubmissionMedia: toolShowSubmissionMedia(user.id, writer),
        prepareSubmission: toolPrepareSubmission(user.id),
        uploadSubmissionMedia: toolUploadSubmissionMedia(user.id),
        executeSql: toolExecuteSQL(writer),
        searchKnowledgeBase: toolSearchKnowledgeBase(
          {
            agentId: chat.agentId
          },
          writer
        ),
        loadDocument: toolLoadDocument(),
        clearChat: toolClearChat(chat.id, chat.agentId, user.id),
        changeRole: toolChangeRole(chat.id, chat.agent.roles),
        createMemory: toolCreateMemory(user.id),
        deleteMemory: toolDeleteMemory(),
        createMultipleChoice: toolCreateMultipleChoice(
          {
            chatId: chat.id
          },
          writer
        ),
        answerMultipleChoice: toolAnswerMultipleChoice({
          chatId: chat.id
        }),
        getAuditSubmissions: toolGetAuditSubmissions(),
        getAuditTrends: toolGetAuditTrends(),
        getObservationsAnalysis: toolGetObservationsAnalysis(),
        getVehicleRanking: toolGetVehicleRanking()
      };

      // Filter tools based on agent capabilities if specified
      const allowedToolNames = getToolNamesFromCapabilities(
        chat.agent.capabilities
      );

      const tools =
        allowedToolNames.length > 0
          ? Object.fromEntries(
              Object.entries(allTools).filter(([name]) =>
                allowedToolNames.includes(name)
              )
            )
          : allTools; // Fallback: all tools if no capabilities specified

      const result = streamText({
        ...createModel(provider, model, {
          reasoning,
          cacheControl,
          contextManagement: {
            enabled: true
          }
        }),
        system: promptWithContext,
        messages: convertToModelMessages(validatedMessages),
        tools,
        stopWhen: [
          stepCountIs(20),
          hasToolCall('createMultipleChoice'),
          hasToolCall('clearChat')
        ]
      });

      writer.write({
        type: 'start',
        messageId: generateId()
      });

      writer.merge(result.toUIMessageStream({ sendStart: false }));
    },
    originalMessages: combinedMessages,
    onFinish: async ({ messages: finishedMessages }) => {
      await db
        .update(chats)
        .set({
          messages: finishedMessages
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
