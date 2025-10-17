# AGENTS.md

This document describes the architecture, testing workflow, and tool management for AI agents in the EasyLog AI platform.

## Table of Contents

- [Agent Architecture](#agent-architecture)
- [Tool System](#tool-system)
- [Testing Workflow](#testing-workflow)
- [Creating Custom Tools](#creating-custom-tools)
- [Agent-Specific Tools](#agent-specific-tools)

---

## Agent Architecture

Agents are stored in the database (`agents` table) with the following key fields:

- `id` - UUID identifier
- `name` - Display name
- `slug` - URL-friendly identifier
- `prompt` - System prompt with instructions, tools documentation, and workflows
- `capabilities` - JSONB object with boolean flags for each tool category

### Database Schema

```typescript
// apps/web/src/database/schema.ts
export type AgentCapabilities = {
  charts?: boolean;
  planning?: boolean;
  sql?: boolean;
  knowledgeBase?: boolean;
  core?: boolean;
  memories?: boolean;
  multipleChoice?: boolean;
  pqiAudits?: boolean;
};

export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  prompt: text('prompt').notNull(),
  capabilities: jsonb('capabilities').$type<AgentCapabilities>(), // Capability-based tool access
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});
```

---

## Capability System

The platform uses a capability-based access control system for agent tools. Instead of listing individual tool names, agents specify which **capability groups** they need access to.

### Why Capabilities?

**Before (allowed_tools):**

```json
{
  "allowed_tools": [
    "getAuditSubmissions",
    "getAuditTrends",
    "getObservationsAnalysis",
    "getVehicleRanking",
    "createBarChart",
    "createLineChart",
    "createMemory",
    "deleteMemory"
  ]
}
```

**After (capabilities):**

```json
{
  "capabilities": {
    "pqiAudits": true,
    "charts": true,
    "memories": true
  }
}
```

**Benefits:**

- ✅ **Organized** - Related tools are grouped together
- ✅ **Maintainable** - Adding tools to a group doesn't require updating agents
- ✅ **Clear Intent** - Capabilities express what the agent can do, not implementation details
- ✅ **Flexible** - Easy to add new capability groups as needed

### Capability Groups

| Capability       | Tools Included                                                                                        | Use Case                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `core`           | clearChat, changeRole                                                                                 | Basic chat functionality (usually always enabled)                                  |
| `charts`         | createBarChart, createLineChart, createPieChart, createStackedBarChart                                | Data visualization                                                                 |
| `planning`       | getDatasources, getPlanningProjects, getPlanningPhases, getResources, createMultipleAllocations, etc. | EasyLog project planning features                                                  |
| `sql`            | executeSql                                                                                            | Direct database queries (use with caution)                                         |
| `knowledgeBase`  | searchKnowledgeBase, loadDocument                                                                     | Document search and RAG                                                            |
| `memories`       | createMemory, deleteMemory                                                                            | User memory management                                                             |
| `multipleChoice` | createMultipleChoice, answerMultipleChoice                                                            | Interactive choice widgets                                                         |
| `pqiAudits`      | getAuditSubmissions, getAuditTrends, getObservationsAnalysis, getVehicleRanking                       | PQI audit analysis (Product Quality Index - productaudit voor kwaliteitsevaluatie) |

### Implementation

The capability-to-tools mapping is defined in `src/app/_chats/utils/getToolNamesFromCapabilities.ts`:

```typescript
export const getToolNamesFromCapabilities = (
  capabilities: AgentCapabilities | null | undefined
): string[] => {
  if (!capabilities) return [];

  const toolNames: string[] = [];

  if (capabilities.pqiAudits) {
    toolNames.push(
      'getAuditSubmissions',
      'getAuditTrends',
      'getObservationsAnalysis',
      'getVehicleRanking'
    );
  }

  // ... other capability checks

  return toolNames;
};
```

---

## Tool System

### Tool Organization

Tools are organized by category in `src/app/_chats/tools/`:

```
tools/
├── charts/              # Visualization tools (createBarChart, createLineChart)
├── core/                # Essential tools (sendMessage, scratchpad, memory)
├── easylog-backend/     # EasyLog Laravel API integration
├── execute-sql/         # General SQL query execution
├── knowledge-base/      # Document search and retrieval
├── multiple-choice/     # Interactive choice widgets
└── pqi-audits/          # PQI audit analysis tools (Product Quality Index) ⭐ NEW
    ├── constants.ts
    ├── types.ts
    ├── config.ts
    ├── toolGetAuditSubmissions.ts
    ├── toolGetAuditTrends.ts
    ├── toolGetObservationsAnalysis.ts
    └── toolGetVehicleRanking.ts
```

### Tool Registration

All tools are registered in `src/app/_chats/tools/tools.config.ts`:

```typescript
import * as chartsTools from './charts/config';
import * as coreTools from './core/config';
import * as pqiAuditsTools from './pqi-audits/config';
// ... other imports

const toolsConfig = {
  ...chartsTools,
  ...coreTools,
  ...pqiAuditsTools
  // ... other tools
} as const;
```

### Agent-Specific Tool Filtering

To prevent tool pollution and organize tool access, agents use capability-based filtering with boolean flags:

```json
{
  "capabilities": {
    "pqiAudits": true,
    "charts": true,
    "core": true
  }
}
```

**Available Capabilities:**

- `core` - Basic tools (clearChat, changeRole)
- `charts` - Visualization tools (createBarChart, createLineChart, createPieChart, createStackedBarChart)
- `planning` - EasyLog planning tools (projects, phases, resources, allocations)
- `sql` - Direct SQL execution (executeSql)
- `knowledgeBase` - Document search and retrieval (searchKnowledgeBase, loadDocument)
- `memories` - User memory management (createMemory, deleteMemory)
- `multipleChoice` - Interactive choice widgets (createMultipleChoice, answerMultipleChoice)
- `pqiAudits` - PQI audit analysis tools (getAuditSubmissions, getAuditTrends, getObservationsAnalysis, getVehicleRanking) - Product Quality Index voor kwaliteitsevaluatie

The chat route filters available tools based on these capabilities:

```typescript
// src/app/(routes)/api/[agentSlug]/chat/route.ts
import getToolNamesFromCapabilities from '@/app/_chats/utils/getToolNamesFromCapabilities';

const allowedToolNames = getToolNamesFromCapabilities(chat.agent.capabilities);

const tools =
  allowedToolNames.length > 0
    ? Object.fromEntries(
        Object.entries(allTools).filter(([name]) =>
          allowedToolNames.includes(name)
        )
      )
    : allTools; // Fallback: all tools if no capabilities specified
```

---

## Testing Workflow

### 1. Local Testing Script

Use `src/scripts/testAgentPrompt.ts` to test agents locally:

```bash
# Test a specific query
bun run src/scripts/testAgentPrompt.ts <agent-slug> "<query>"

# Example: Test agent with PQI audits
bun run src/scripts/testAgentPrompt.ts ret "Wat zijn de meest voorkomende problemen?"
```

**Script Features:**

- ✅ Loads agent from database
- ✅ Filters tools based on `allowed_tools`
- ✅ Shows tool calls and results
- ✅ Displays final AI response
- ✅ Debug logging for troubleshooting

### 2. Test Query Development

When creating or updating agent prompts:

1. **Document workflows in prompt** - Include clear workflow scenarios with tool usage examples
2. **Create test queries** - Map each workflow to specific test queries
3. **Run systematic tests** - Test each workflow scenario
4. **Verify tool usage** - Ensure agent calls correct tools with proper parameters
5. **Check output quality** - Verify responses are professional, accurate, and actionable

### 3. Example: RET Agent Testing

**Test Queries by Workflow:**

```bash
# Workflow 2: Vehicle Performance
bun run src/scripts/testAgentPrompt.ts ret "Wat zijn de prestaties van voertuig 2108?"

# Workflow 3: Safety Risks
bun run src/scripts/testAgentPrompt.ts ret "Welke veiligheidsrisico's zijn er in de laatste week?"

# Workflow 4: Problem Analysis
bun run src/scripts/testAgentPrompt.ts ret "Top 20 meest voorkomende problemen"

# Workflow 5: Vehicle Ranking
bun run src/scripts/testAgentPrompt.ts ret "Welke voertuigen hebben de meeste issues?"

# Workflow 6: Trend Monitoring
bun run src/scripts/testAgentPrompt.ts ret "Laat de maandelijkse trend van 2024 zien"

# Filter Combinations
bun run src/scripts/testAgentPrompt.ts ret "PQI audits voor Metro materieel"

# Edge Cases
bun run src/scripts/testAgentPrompt.ts ret "Voertuig 99999 prestaties"
```

### 4. Debugging Failed Tests

When tests fail or produce unexpected results:

**Check Tool Calls:**

```typescript
console.log('Tool Calls:', result.toolCalls);
console.log('Tool Results:', result.toolResults);
console.log('Finish Reason:', result.finishReason);
```

**Common Issues:**

- ❌ **Empty response** - Check `maxSteps` or `stopWhen` configuration
- ❌ **Wrong tool called** - Update prompt with clearer tool descriptions
- ❌ **Tool error** - Check tool implementation and database connectivity
- ❌ **Incorrect parameters** - Improve parameter descriptions in tool schema
- ❌ **Metadata pollution** - Ensure tools return clean JSON (not raw query results)

**Fix Pattern (Data Cleaning):**

```typescript
// ❌ BAD: Returns [data, metadata] tuple
return JSON.stringify(result, null, 2);

// ✅ GOOD: Extract only data
const data = Array.isArray(result) && result.length > 0 ? result[0] : result;
return JSON.stringify(data, null, 2);
```

**Fix Pattern (Multi-step):**

```typescript
// ❌ BAD: Only one generation step
const result = await generateText({ model, messages, tools });

// ✅ GOOD: Allow multiple steps for tool calls
const result = await generateText({
  model,
  messages,
  tools,
  stopWhen: stepCountIs(5) // or maxSteps: 5
});
```

---

## Creating Custom Tools

### Step 1: Tool Implementation

Create tool file in appropriate category folder:

```typescript
// src/app/_chats/tools/[category]/toolExample.ts
import { tool } from 'ai';
import { z } from 'zod';

export const getExampleConfig = {
  name: 'getExample',
  description: 'Clear description of what this tool does and when to use it',
  inputSchema: z.object({
    param1: z.string().describe('What this parameter does'),
    param2: z.number().optional().describe('Optional parameter description')
  })
} as const;

const toolExample = () => {
  return tool({
    ...getExampleConfig,
    execute: async (params) => {
      try {
        // Implementation
        const result = await fetchData(params);

        // Clean data extraction (important!)
        const data =
          Array.isArray(result) && result.length > 0 ? result[0] : result;

        return JSON.stringify(data, null, 2);
      } catch (error) {
        console.error('Error in getExample:', error);
        return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }
  });
};

export default toolExample;
```

### Step 2: Export Config

Add to category's `config.ts`:

```typescript
// src/app/_chats/tools/[category]/config.ts
import toolExample, { getExampleConfig } from './toolExample';

export { toolExample, getExampleConfig };
```

### Step 3: Register in Tools Config

```typescript
// src/app/_chats/tools/tools.config.ts
import * as exampleTools from './[category]/config';

const toolsConfig = {
  ...exampleTools
  // ... other tools
} as const;
```

### Step 4: Document in Agent Prompt

Add tool documentation to agent's prompt:

```markdown
## 🔧 Example Tool

**Use for**: Clear use case description

**Parameters:**

- `param1`: Description
- `param2`: Description (optional)

**Examples:**
getExample({ param1: "value" })
getExample({ param1: "value", param2: 123 })

**Workflow:**

1. User asks X
2. Call getExample
3. Present results as Y
```

### Step 5: Enable Agent Capability

Update agent in database to enable the capability category for your new tool:

```sql
-- Enable a capability for an agent
UPDATE agents
SET capabilities = jsonb_set(
  COALESCE(capabilities, '{}'::jsonb),
  '{exampleCapability}',
  'true'::jsonb
)
WHERE slug = 'agent-slug';

-- Or set multiple capabilities at once
UPDATE agents
SET capabilities = '{
  "core": true,
  "charts": true,
  "exampleCapability": true
}'::jsonb
WHERE slug = 'agent-slug';
```

**Note**: Make sure to add your tool to the appropriate capability group in `getToolNamesFromCapabilities.ts`

### Step 6: Test

```bash
bun run src/scripts/testAgentPrompt.ts agent-slug "Test query that should use getExample"
```

---

## Agent-Specific Tools

### PQI Audits Tools (Example)

Product Quality Index tools - 4 specialized tools for productaudit analyses:

**1. getAuditSubmissions** - Retrieve individual audits

```typescript
Parameters: { auditType?, modality?, vehicleNumber?, year?, hasSafetyRisks?, limit? }
Use for: Getting raw audit data with filters
```

**2. getAuditTrends** - Analyze trends over time

```typescript
Parameters: { auditType?, modality?, vehicleNumber?, year?, groupBy? }
Use for: Monthly/weekly trend analysis
```

**3. getObservationsAnalysis** - Find common problems

```typescript
Parameters: { auditType?, modality?, vehicleNumber?, year?, minScore?, limit? }
Use for: Top N problem identification
```

**4. getVehicleRanking** - Rank vehicles by performance

```typescript
Parameters: { auditType?, modality?, year?, limit? }
Use for: Vehicle performance comparison
```

**Tool Design Principles:**

- ✅ **Type-safe** - Zod schemas with proper TypeScript types
- ✅ **Parameterized** - Use `sql` template literals (never string concatenation)
- ✅ **Filtered** - Dynamic WHERE clauses based on parameters
- ✅ **Clean output** - Return only data, not metadata
- ✅ **Error handling** - Try-catch with Sentry logging
- ✅ **Documented** - Clear descriptions in prompt

---

## Best Practices

### Prompt Engineering

1. **Tool Documentation First** - Document all available tools with clear examples
2. **Workflow Scenarios** - Show step-by-step usage in common scenarios
3. **Parameter Guidance** - Explain when to use each parameter
4. **Error Patterns** - Document how to handle errors and edge cases
5. **Output Format** - Specify expected response format (tables, charts, insights)

### Tool Development

1. **Single Responsibility** - Each tool does one thing well
2. **Composability** - Tools can be combined in workflows
3. **Type Safety** - Full TypeScript + Zod validation
4. **SQL Injection Prevention** - Always use parameterized queries
5. **Performance** - Add indexes, use LIMIT, optimize queries
6. **Testing** - Test with various parameters and edge cases

### Agent Configuration

1. **Capability-Based Access** - Enable only the capability groups the agent needs
2. **Organized Tool Groups** - Capabilities group related tools together
3. **Clear Boundaries** - Don't enable unrelated capability categories
4. **Version Prompts** - Include version in prompt for tracking changes
5. **Test Coverage** - Document test queries for each workflow
6. **Monitor Usage** - Track which capabilities/tools are used most/least

---

## Troubleshooting

### Agent doesn't call any tools

- ✅ Check `capabilities` includes necessary capability flags
- ✅ Verify tool is mapped in `getToolNamesFromCapabilities.ts`
- ✅ Verify tool descriptions are clear in prompt
- ✅ Ensure examples show when to use tools
- ✅ Check if `maxSteps` / `stopWhen` is configured

### Tool returns errors

- ✅ Verify database connectivity
- ✅ Check parameter validation
- ✅ Review SQL query syntax
- ✅ Test tool in isolation

### Response is empty

- ✅ Ensure `maxSteps > 1` or use `stopWhen(stepCountIs(5))`
- ✅ Check `finishReason` in debug output
- ✅ Verify tool returns clean JSON (not metadata)

### Wrong tool parameters

- ✅ Improve parameter descriptions
- ✅ Add examples to prompt
- ✅ Use Zod `.describe()` for guidance

---

## Related Documentation

- [CLAUDE.md](../../CLAUDE.md) - Overall project documentation
- [Database Schema](./src/database/schema.ts) - Full schema reference

---

_Last updated: 2025-10-14 - Migrated from allowed_tools to capability-based access control system_
