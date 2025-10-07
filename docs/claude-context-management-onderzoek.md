# Claude Context Management Onderzoek

## Toepassing in EasyLog Python Agents

**Datum**: 6 oktober 2025  
**Scope**: Analyse van Claude Agent SDK context management features voor MUMC Agent implementatie

---

## Executive Summary

Dit onderzoek evalueert hoe Claude's context management features kunnen worden toegepast in de huidige EasyLog Python agent architectuur via OpenRouter. De belangrijkste bevinding: **OpenRouter ondersteunt al volledige Claude functionaliteit** (200K context window), maar specifieke SDK features moeten custom worden geïmplementeerd.

**Belangrijkste Conclusies**:

- ✅ **OpenRouter werkt perfect** - Volledige Claude Sonnet 4 toegang met 200K tokens
- ✅ **Behoud OpenRouter** - Model flexibiliteit blijft behouden (300+ modellen)
- ✅ **Implementeer custom context management** - Intelligent pruning en summarization
- ✅ **Implementeer enhanced memory** - Semantic search over memories
- ❌ **Claude Agent SDK niet nodig** - Custom oplossingen zijn beter voor jullie use case

---

## 1. Huidige Situatie Analyse

### 1.1 Architectuur Overzicht

```python
# Huidige setup
OpenRouter Proxy → Claude Models (Sonnet 4/4.5)
                 → OpenAI GPT-4.1
                 → 300+ andere modellen

# Context management
Database (Prisma) → Alle messages opgeslagen
                 → Volledige history geladen per request
                 → Geen automatische pruning/summarization
```

### 1.2 Huidige Context Flow

**In `message_service.py` (regel 80-97)**:

```python
# Fetch VOLLEDIGE thread history
thread_history: Iterable[ChatCompletionMessageParam] = [
    *(
        db_message_to_openai_param(message)
        for message in await prisma.messages.find_many(
            where={"thread_id": thread_id},
            order={"created_at": "asc"},
        )
    ),
    input_content_to_openai_param(input_content),
]
```

**Probleem**: Bij lange gesprekken (>200 messages) wordt:

- ✅ Database vol → kost opslag
- ✅ API calls duur → alle messages worden verstuurd
- ❌ Context loss risico → te veel tokens
- ❌ Performance → langzame queries

### 1.3 MUMC Agent Specifieke Context

De MUMC Agent heeft unieke requirements:

- **Healthcare data**: ZLM scores, stappen, medicatie
- **Memory systeem**: Opslag in `thread.metadata`
- **Recurring tasks**: Cron-based notificaties
- **Super agent**: Autonome background processing
- **Compliance**: HIPAA-compatible data handling

**Huidige memory systeem** (regel 975-994):

```python
async def tool_store_memory(memory: str) -> str:
    """Store a memory with automatic timestamp."""
    memories = await self.get_metadata("memories", [])
    memories.append({"id": str(uuid.uuid4())[0:8], "memory": memory_with_date})
    await self.set_metadata("memories", memories)
```

---

## 2. Claude Agent SDK Features

### 2.1 Context Editing

**Wat het doet**:

- Automatisch verouderde tool results verwijderen
- Token window management
- Intelligente pruning van oude content

**Hoe het werkt**:

```python
# Claude Agent SDK (voorbeeld)
options = ClaudeAgentOptions(
    context_editing=True,  # Auto-remove old tool results
    max_context_tokens=150000,  # Claude Sonnet 4: 200K tokens
)
```

**Voor EasyLog**:

- ✅ Nuttig: Veel tool calls (SQL, documents, charts)
- ✅ Nuttig: Super agent loops (recurring notifications)
- ❌ Probleem: Werkt alleen met native Claude API

### 2.2 Memory Tool

**Wat het doet**:

- Persistent storage buiten context window
- File-based system voor long-term memory
- Semantic retrieval van relevante memories

**Hoe het werkt**:

```python
# Conceptueel
claude.memory.store("Patient John heeft COPD GOLD 2, medicatie: Symbicort")
relevant = claude.memory.retrieve("Welke medicatie gebruikt John?")
```

**Voor EasyLog**:

- ✅ **Al geïmplementeerd**: `thread.metadata` memories
- ✅ Beter dan Claude's file-based: Structured JSON storage
- ✅ Database-backed: Query capabilities
- ⚠️ Verbetering mogelijk: Semantic search over memories

### 2.3 Model Context Protocol (MCP)

**Wat het doet**:

- Standaard protocol voor tool definitions
- External service integrations
- Reusable tool servers

**Voor EasyLog**:

- ✅ Relevant: Jullie hebben al veel tools
- ✅ Mogelijk: MCP-compatible tool definitions
- ❌ Niet nodig: Huidige tool systeem werkt goed

---

## 3. OpenRouter Context Management Ondersteuning

### 3.1 Wat OpenRouter WEL Ondersteunt ✅

**Volledige Claude toegang via OpenRouter**:

1. **Extended Context Window**: 200K tokens voor Claude Sonnet 4
2. **All Model Features**: Streaming, tool use, vision, etc.
3. **Standard Context Management**: Conversation history via `messages` array
4. **Model Flexibility**: 300+ modellen beschikbaar
5. **Cost Optimization**: Per role verschillende modellen kiezen
6. **Fallback Strategy**: Alternatieve modellen bij outages

**OpenRouter setup (huidige implementatie)**:

```python
from openai import AsyncOpenAI

# OpenAI-compatible API - werkt perfect met Claude
client = AsyncOpenAI(
    api_key=settings.OPENROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1",
)

# Volledige Claude Sonnet 4 support met 200K context
response = await client.chat.completions.create(
    model="anthropic/claude-sonnet-4",
    messages=[...],  # Tot 200K tokens!
)
```

### 3.2 Wat NIET via OpenRouter Werkt ❌

**Claude Agent SDK specifieke features**:

- ❌ **Prompt Caching**: Anthropic-specific billing optimization

  - Dit is een backend caching systeem bij Anthropic
  - Niet beschikbaar via proxy services zoals OpenRouter
  - **Alternative**: Implement eigen caching layer (Redis/memory)

- ❌ **Claude Agent SDK**: Native Python SDK features
  - Memory Tool (file-based storage)
  - Context Editing (auto-pruning)
  - **Alternative**: Custom implementatie (zie sectie 4)

### 3.3 Waarom OpenRouter Behouden? ✅

**Voordelen blijven intact**:

- ✅ **Volledige Claude access** (200K context window)
- ✅ **Model flexibiliteit** (switch tussen modellen)
- ✅ **Cost optimization** (per role andere modellen)
- ✅ **Future-proof** (nieuwe modellen automatisch)
- ✅ **No vendor lock-in** (niet vast aan één provider)

**Conclusie**: ✅ **Behoud OpenRouter** - Je hebt al volledige Claude toegang!

---

## 4. Aanbevolen Aanpak: Hybride Strategie

### 4.1 Strategie Overzicht

**BEHOUD**:

- ✅ OpenRouter voor model routing
- ✅ Huidige tool architecture
- ✅ Prisma database storage

**IMPLEMENTEER**:

- ✅ Smart context window management
- ✅ Message summarization
- ✅ Improved memory retrieval
- ✅ Token usage optimization

### 4.2 Context Window Management Implementatie

**Stap 1: Context Size Monitoring**

```python
# New file: src/agents/utils/context_manager.py

from typing import Iterable
from openai.types.chat import ChatCompletionMessageParam
import tiktoken

class ContextManager:
    """Manage context window size for agents."""

    def __init__(
        self,
        max_tokens: int = 150000,  # Claude Sonnet 4: 200K tokens
        target_tokens: int = 100000,  # Leave room for response
        model: str = "claude-3-5-sonnet-20241022",
    ):
        self.max_tokens = max_tokens
        self.target_tokens = target_tokens
        self.encoding = tiktoken.encoding_for_model("gpt-4")  # Approximation

    def count_tokens(
        self,
        messages: Iterable[ChatCompletionMessageParam]
    ) -> int:
        """Count total tokens in message list."""
        total = 0
        for message in messages:
            # Count role
            total += 4  # Every message has role overhead

            # Count content
            if isinstance(message.get("content"), str):
                total += len(self.encoding.encode(message["content"]))
            elif isinstance(message.get("content"), list):
                for part in message["content"]:
                    if part.get("type") == "text":
                        total += len(self.encoding.encode(part.get("text", "")))

            # Count tool calls
            if "tool_calls" in message:
                for tool_call in message["tool_calls"]:
                    total += len(self.encoding.encode(str(tool_call)))

        return total

    def needs_pruning(
        self,
        messages: Iterable[ChatCompletionMessageParam]
    ) -> bool:
        """Check if context needs pruning."""
        return self.count_tokens(messages) > self.target_tokens
```

**Stap 2: Intelligent Message Pruning**

```python
class ContextManager:
    # ... continued

    def prune_context(
        self,
        messages: list[ChatCompletionMessageParam],
        system_prompt: str,
    ) -> tuple[list[ChatCompletionMessageParam], str]:
        """
        Intelligently prune context to fit within token limits.

        Strategy:
        1. Keep system prompt
        2. Keep last N user-assistant exchanges (important for coherence)
        3. Summarize middle section
        4. Remove old tool results

        Returns:
            (pruned_messages, summary_of_removed_content)
        """
        if not self.needs_pruning(messages):
            return messages, ""

        # Configuration
        keep_recent_messages = 20  # Keep last 20 messages always
        keep_first_messages = 5    # Keep first 5 for context

        if len(messages) <= (keep_recent_messages + keep_first_messages):
            return messages, ""

        # Split messages
        first_messages = messages[:keep_first_messages]
        middle_messages = messages[keep_first_messages:-keep_recent_messages]
        recent_messages = messages[-keep_recent_messages:]

        # Summarize middle section
        summary = self._create_conversation_summary(middle_messages)

        # Create summary message
        summary_message: ChatCompletionMessageParam = {
            "role": "system",
            "content": f"""
## Conversation Summary (Previous Context)

The following is a summary of earlier conversation that has been
compressed to save context space:

{summary}

---
Current conversation continues below:
"""
        }

        # Reconstruct message list
        pruned = [
            *first_messages,
            summary_message,
            *recent_messages,
        ]

        return pruned, summary

    def _create_conversation_summary(
        self,
        messages: list[ChatCompletionMessageParam],
    ) -> str:
        """Create a concise summary of conversation section."""

        # Extract key information
        user_questions = []
        assistant_responses = []
        tool_usage = []

        for msg in messages:
            role = msg.get("role")
            content = msg.get("content")

            if role == "user" and isinstance(content, str):
                user_questions.append(content[:200])  # First 200 chars
            elif role == "assistant" and isinstance(content, str):
                assistant_responses.append(content[:200])
            elif role == "tool" or "tool_calls" in msg:
                tool_usage.append(msg.get("name", "unknown_tool"))

        summary_parts = []

        if user_questions:
            summary_parts.append(
                f"User asked about: {', '.join(set(user_questions[:5]))}"
            )

        if tool_usage:
            tool_counts = {}
            for tool in tool_usage:
                tool_counts[tool] = tool_counts.get(tool, 0) + 1
            summary_parts.append(
                f"Tools used: {', '.join(f'{k}({v}x)' for k, v in tool_counts.items())}"
            )

        return " | ".join(summary_parts) if summary_parts else "No significant activity"
```

**Stap 3: Integration in MUMCAgent**

```python
# In mumc_agent.py

from src.agents.utils.context_manager import ContextManager

class MUMCAgent(BaseAgent[MUMCAgentConfig]):

    def on_init(self) -> None:
        super().on_init()
        # Initialize context manager
        self.context_manager = ContextManager(
            max_tokens=150000,
            target_tokens=100000,
        )

    async def on_message(
        self,
        messages: Iterable[ChatCompletionMessageParam],
        _: int = 0
    ) -> tuple[AsyncStream[ChatCompletionChunk] | ChatCompletion, list[Callable]]:

        # Convert to list for processing
        message_list = list(messages)

        # Check if pruning is needed
        if self.context_manager.needs_pruning(message_list):
            self.logger.info(
                f"Context pruning needed. "
                f"Current: {self.context_manager.count_tokens(message_list)} tokens"
            )

            # Prune context
            pruned_messages, summary = self.context_manager.prune_context(
                message_list,
                system_prompt=llm_content,  # System prompt from existing code
            )

            self.logger.info(
                f"Context pruned. New size: "
                f"{self.context_manager.count_tokens(pruned_messages)} tokens. "
                f"Summary: {summary[:100]}..."
            )

            # Store summary in metadata for future reference
            summaries = await self.get_metadata("conversation_summaries", [])
            summaries.append({
                "id": str(uuid.uuid4())[:8],
                "timestamp": datetime.now(pytz.timezone("Europe/Amsterdam")).isoformat(),
                "summary": summary,
                "messages_compressed": len(message_list) - len(pruned_messages),
            })
            await self.set_metadata("conversation_summaries", summaries)

            message_list = pruned_messages

        # Continue with existing code...
        response = await self.client.chat.completions.create(
            model=role_config.model,
            messages=[
                {"role": "system", "content": llm_content},
                *message_list,  # Use pruned messages
            ],
            stream=True,
            tools=[function_to_openai_tool(tool) for tool in tools_values],
            tool_choice="auto",
        )

        return response, list(tools_values)
```

---

## 5. Enhanced Memory System

### 5.1 Semantic Memory Search

**Probleem**: Huidige memory is lineair opgeslagen, geen search

**Oplossing**: Embeddings-based search over memories

```python
# New file: src/agents/utils/memory_manager.py

from typing import Any
import numpy as np
from openai import AsyncOpenAI

class MemoryManager:
    """Enhanced memory management with semantic search."""

    def __init__(self, openai_client: AsyncOpenAI):
        self.client = openai_client

    async def store_memory_with_embedding(
        self,
        memory: str,
        metadata: dict[str, Any],
        thread_id: str,
    ) -> str:
        """Store memory with semantic embedding."""

        # Generate embedding
        response = await self.client.embeddings.create(
            model="text-embedding-3-small",
            input=memory,
        )
        embedding = response.data[0].embedding

        # Store in database with embedding
        memory_record = await prisma.memories.create(
            data={
                "thread_id": thread_id,
                "content": memory,
                "embedding": embedding,  # Store as vector
                "metadata": Json(metadata),
                "created_at": datetime.now(),
            }
        )

        return memory_record.id

    async def search_memories(
        self,
        query: str,
        thread_id: str,
        top_k: int = 5,
    ) -> list[dict[str, Any]]:
        """Semantic search over memories."""

        # Generate query embedding
        response = await self.client.embeddings.create(
            model="text-embedding-3-small",
            input=query,
        )
        query_embedding = response.data[0].embedding

        # Find similar memories using cosine similarity
        # (requires pgvector extension in PostgreSQL)
        memories = await prisma.query_raw(
            """
            SELECT
                id, content, metadata, created_at,
                1 - (embedding <=> $1::vector) AS similarity
            FROM memories
            WHERE thread_id = $2
            ORDER BY embedding <=> $1::vector
            LIMIT $3
            """,
            query_embedding,
            thread_id,
            top_k,
        )

        return memories
```

### 5.2 Memory Categorization

```python
class MemoryCategory:
    """Categories for organizing memories."""

    PERSONAL_INFO = "personal"      # Name, age, diagnosis
    MEDICAL_DATA = "medical"        # Medications, ZLM scores
    GOALS = "goals"                 # User goals and targets
    PREFERENCES = "preferences"     # Communication style, preferences
    EVENTS = "events"               # Appointments, important dates

class MemoryManager:
    # ... continued

    async def categorize_memory(self, memory: str) -> str:
        """Use LLM to categorize memory."""

        response = await self.client.chat.completions.create(
            model="openai/gpt-4.1-mini",  # Fast and cheap
            messages=[
                {
                    "role": "system",
                    "content": f"""
Categorize this memory into one of these categories:
- {MemoryCategory.PERSONAL_INFO}
- {MemoryCategory.MEDICAL_DATA}
- {MemoryCategory.GOALS}
- {MemoryCategory.PREFERENCES}
- {MemoryCategory.EVENTS}

Respond with only the category name.
""",
                },
                {"role": "user", "content": memory},
            ],
        )

        return response.choices[0].message.content.strip()
```

---

## 6. Implementation Roadmap

### Phase 1: Context Management (Week 1-2)

**Deliverables**:

- ✅ `ContextManager` class implementatie
- ✅ Token counting functionaliteit
- ✅ Intelligent pruning algorithm
- ✅ Integration in `MessageService`
- ✅ Testing met lange conversations

**Success Metrics**:

- Threads >200 messages blijven functioneel
- Token costs reduced by ~40%
- Response quality maintained

### Phase 2: Enhanced Memory (Week 3-4)

**Deliverables**:

- ✅ Add `embeddings` column to database
- ✅ `MemoryManager` implementation
- ✅ Semantic search functionality
- ✅ Memory categorization
- ✅ Migration script voor bestaande memories

**Success Metrics**:

- Memory retrieval accuracy >90%
- Relevant memories oppervlak in context
- Better long-term retention

### Phase 3: Optimization (Week 5-6)

**Deliverables**:

- ✅ Performance monitoring dashboard
- ✅ A/B testing framework
- ✅ Cost tracking per conversation
- ✅ Auto-tuning van parameters

**Success Metrics**:

- Average response time <2s
- Cost per conversation <€0.10
- User satisfaction maintained

---

## 7. Database Schema Changes

### 7.1 New Tables

```prisma
// schema.prisma additions

model memories {
  id         String   @id @default(uuid())
  thread_id  String
  content    String
  embedding  Float[]  // Requires pgvector extension
  category   String?
  metadata   Json?
  created_at DateTime @default(now())

  thread threads @relation(fields: [thread_id], references: [id], onDelete: Cascade)

  @@index([thread_id])
  @@index([category])
}

model conversation_summaries {
  id                    String   @id @default(uuid())
  thread_id             String
  summary_text          String
  messages_compressed   Int
  token_count_before    Int
  token_count_after     Int
  created_at            DateTime @default(now())

  thread threads @relation(fields: [thread_id], references: [id], onDelete: Cascade)

  @@index([thread_id])
  @@index([created_at])
}
```

### 7.2 PostgreSQL Setup

```sql
-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create index for fast similarity search
CREATE INDEX ON memories USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

---

## 8. Cost-Benefit Analysis

### 8.1 Current Costs (Estimated)

```
Gemiddelde thread: 150 messages
Per message: ~500 tokens
Total per request: 75,000 tokens

Claude Sonnet 4 pricing (via OpenRouter):
- Input: $3 per 1M tokens
- Output: $15 per 1M tokens

Cost per request: $0.225 (input) + $0.075 (output) = $0.30
Cost per 100 users/day (5 requests): $150/day = $4,500/month
```

### 8.2 Projected Costs with Context Management

```
Met pruning: 50% reduction in input tokens
Average: 40,000 tokens per request

Cost per request: $0.120 + $0.075 = $0.195
Cost per 100 users/day: $97.50/day = $2,925/month

Savings: $1,575/month (35% reduction)
```

### 8.3 Implementation Costs

```
Development time: 6 weeks @ €800/day
Total development: €24,000

ROI breakpoint: 15 months (for 100 users)
ROI at scale (1000 users): 1.5 months
```

---

## 9. Risks & Mitigation

### 9.1 Context Loss Risk

**Risk**: Pruning kan belangrijke context verwijderen

**Mitigation**:

- Keep last 20 messages altijd
- Summaries opslaan in database
- A/B testing met en zonder pruning
- User feedback monitoring

### 9.2 Performance Impact

**Risk**: Extra processing overhead

**Mitigation**:

- Async processing waar mogelijk
- Cache token counts
- Background summarization
- Incremental updates

### 9.3 Compatibility

**Risk**: Breaks bestaande functionaliteit

**Mitigation**:

- Feature flags voor gradual rollout
- Extensive testing suite
- Rollback strategie
- Monitoring alerts

---

## 10. Alternatieve Opties

### Option A: Native Claude SDK (❌ Niet aanbevolen)

**Pros**:

- Out-of-the-box context management
- Official support
- Future updates included

**Cons**:

- ❌ Verlies OpenRouter flexibiliteit
- ❌ Geen multi-model support
- ❌ Vendor lock-in
- ❌ Migratie effort hoog

### Option B: Hybrid (✅ AANBEVOLEN)

**Pros**:

- ✅ Behoud OpenRouter
- ✅ Custom oplossingen
- ✅ Full control
- ✅ Incremental implementation

**Cons**:

- ⚠️ Meer development werk
- ⚠️ Eigen maintenance

### Option C: Status Quo (❌ Niet duurzaam)

**Pros**:

- Geen changes needed
- Works currently

**Cons**:

- ❌ Scaling issues
- ❌ High costs
- ❌ Context window limits
- ❌ Poor long-term viability

---

## 11. Conclusies & Next Steps

### 11.1 Belangrijkste Conclusies

1. **Claude Agent SDK is niet nodig**: De features zijn toepasbaar zonder de SDK
2. **Context management is cruciaal**: Voor scaling beyond 100 users
3. **Hybride aanpak is beste**: Custom solutions + OpenRouter flexibility
4. **ROI is positief**: Vooral bij scale (>100 users)

### 11.2 Recommended Actions

**Direct (Week 1)**:

- [ ] Team alignment meeting
- [ ] Approve implementation roadmap
- [ ] Setup development branch
- [ ] Create test dataset (long conversations)

**Short-term (Week 1-2)**:

- [ ] Implement `ContextManager` class
- [ ] Add token counting/monitoring
- [ ] Test pruning algorithms
- [ ] Deploy to staging environment

**Medium-term (Week 3-6)**:

- [ ] Enhanced memory system
- [ ] Performance optimization
- [ ] Production deployment
- [ ] User feedback collection

**Long-term (Month 2-3)**:

- [ ] Monitor cost savings
- [ ] Optimize parameters
- [ ] Scale to all agents
- [ ] Document learnings

---

## 12. Resources

### Documentation

- [Claude Agent SDK Python](https://github.com/anthropics/claude-agent-sdk-python)
- [Anthropic Context Management](https://www.anthropic.com/news/context-management)
- [OpenRouter API Docs](https://openrouter.ai/docs)
- [Tiktoken (Token Counting)](https://github.com/openai/tiktoken)

### Internal References

- `apps/api/src/services/messages/message_service.py` - Current message handling
- `apps/api/src/agents/implementations/mumc_agent.py` - MUMC Agent implementation
- `apps/api/src/agents/base_agent.py` - Base agent architecture

### Contact

- **Document author**: AI Assistant via Cursor
- **Review needed**: Development team lead
- **Questions**: Ewout van Dijck

---

_Laatste update: 6 oktober 2025_
