import { generateText, stepCountIs } from 'ai';

import toolGetAuditSubmissions from '@/app/_chats/tools/ret-audits/toolGetAuditSubmissions';
import toolGetAuditTrends from '@/app/_chats/tools/ret-audits/toolGetAuditTrends';
import toolGetObservationsAnalysis from '@/app/_chats/tools/ret-audits/toolGetObservationsAnalysis';
import toolGetVehicleRanking from '@/app/_chats/tools/ret-audits/toolGetVehicleRanking';
import getToolNamesFromCapabilities from '@/app/_chats/utils/getToolNamesFromCapabilities';
import db from '@/database/client';
import openrouter from '@/lib/ai-providers/openrouter';

const testAgentPrompt = async (slug: string, userMessage: string) => {
  console.log('🔍 Loading agent:', slug);
  const agent = await db.query.agents.findFirst({
    where: {
      slug: slug
    }
  });

  if (!agent) {
    throw new Error(`Agent with slug ${slug} not found`);
  }

  console.log('✅ Agent found:', agent.name);
  console.log('📝 User message:', userMessage);
  console.log('⚙️  Calling generateText with tools...\n');

  const prompt = agent.prompt;

  try {
    // Build all available tools
    const allTools = {
      getVehicleRanking: toolGetVehicleRanking(),
      getObservationsAnalysis: toolGetObservationsAnalysis(),
      getAuditTrends: toolGetAuditTrends(),
      getAuditSubmissions: toolGetAuditSubmissions()
      // TODO: Add other tools as needed for testing
    };

    // Filter tools based on agent capabilities if specified
    const allowedToolNames = getToolNamesFromCapabilities(agent.capabilities);

    const tools =
      allowedToolNames.length > 0
        ? Object.fromEntries(
            Object.entries(allTools).filter(([name]) =>
              allowedToolNames.includes(name)
            )
          )
        : allTools;

    console.log(
      '🔧 Available tools:',
      allowedToolNames.length > 0
        ? allowedToolNames.filter((t) => Object.keys(allTools).includes(t))
        : Object.keys(allTools)
    );

    const result = await generateText({
      stopWhen: stepCountIs(5),
      model: openrouter('anthropic/claude-sonnet-4.5'),
      messages: [
        {
          role: 'system',
          content: prompt
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      tools
    });

    console.log(
      '📊 Result object:',
      JSON.stringify(
        {
          text: result.text,
          toolCalls: result.toolCalls,
          toolResults: result.toolResults,
          finishReason: result.finishReason
        },
        null,
        2
      )
    );

    console.log('\n💬 Final text response:');
    console.log(result.text);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testAgentPrompt(process.argv[2] ?? '', process.argv[3] ?? '')
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
