# OpenRouter + Claude: Wat Werkt WEL

**TL;DR**: Je hebt via OpenRouter al **volledige toegang** tot Claude's 200K context window en alle features. De Claude Agent SDK is **niet nodig**.

---

## ✅ Wat Je NU Al Hebt via OpenRouter

### 1. Volledige Claude Sonnet 4 Access

```python
# Jullie huidige setup werkt perfect!
client = AsyncOpenAI(
    api_key=settings.OPENROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1",
)

response = await client.chat.completions.create(
    model="anthropic/claude-sonnet-4",
    messages=[...],  # Tot 200.000 tokens! 🎉
    stream=True,
)
```

### 2. Extended Context Window

- **200K tokens** beschikbaar
- **~600 paginas** tekst
- **~150,000 woorden**
- Perfect voor lange conversaties!

### 3. Alle Claude Features

- ✅ Streaming responses
- ✅ Tool/function calling
- ✅ Vision (image input)
- ✅ JSON mode
- ✅ System prompts
- ✅ Temperature/top_p tuning

### 4. Model Flexibility (Bonus!)

```python
# Healthcare: Premium model
model="anthropic/claude-sonnet-4"

# Regular tasks: Goedkoper alternatief
model="openai/gpt-4.1-mini"

# Super agent: Cost-effective
model="anthropic/claude-sonnet-4.5"
```

---

## ❌ Wat NIET Werkt via OpenRouter

### 1. Prompt Caching (Anthropic Backend)

**Wat het is**: Anthropic slaat delen van je prompt op in hun backend om kosten te besparen bij herhaalde requests.

**Waarom niet via OpenRouter**:

- Dit is een Anthropic billing/infrastructure feature
- OpenRouter is een proxy, heeft geen toegang tot Anthropic's caching layer

**Alternative**:

```python
# Implement eigen caching layer
import redis

cache = redis.Redis(host='localhost', port=6379)

# Cache system prompts, long documents, etc.
cache_key = f"system_prompt:{agent_id}"
if cached := cache.get(cache_key):
    system_prompt = cached
else:
    system_prompt = generate_system_prompt()
    cache.set(cache_key, system_prompt, ex=3600)  # 1 hour
```

### 2. Claude Agent SDK Native Features

**Wat niet werkt**:

- Memory Tool (file-based storage)
- Context Editing (auto-pruning)
- Agent lifecycle hooks

**Waarom niet nodig**:

- Jullie hebben al betere alternatieven!
- `thread.metadata` voor memories
- Custom context management (zie onderzoeksdocument)
- Prisma database voor persistentie

---

## 🎯 Wat Te Doen

### Direct Implementeren (Week 1-2)

**1. Context Size Monitoring**

```python
# Add to mumc_agent.py
from src.agents.utils.context_manager import ContextManager

self.context_manager = ContextManager(
    max_tokens=150000,  # Claude Sonnet 4: 200K
    target_tokens=100000  # Leave room for response
)

# Log before each API call
token_count = self.context_manager.count_tokens(messages)
self.logger.info(f"📊 Sending {token_count} tokens to Claude")
```

**2. Smart Pruning** (bij >100K tokens)

```python
if self.context_manager.needs_pruning(messages):
    pruned, summary = self.context_manager.prune_context(messages)
    messages = pruned
    # Sla summary op in metadata
```

**Resultaat**:

- 30-40% cost reduction voor lange threads
- Geen context window errors meer
- Betere performance (minder tokens = sneller)

### Later Overwegen (Week 3+)

**3. Semantic Memory Search**

```python
# Embeddings voor memories
memory_with_embedding = await store_memory(
    "Patient John heeft COPD GOLD 2",
    embedding=await get_embedding(text)
)

# Later: search semantically
relevant = await search_memories(
    "Welke diagnose heeft John?",
    top_k=5
)
```

**4. Redis Caching Layer**

```python
# Cache frequently used content
- System prompts
- Document summaries
- ZLM score lookups
- User profile data
```

---

## 💰 Cost Impact Analyse

### Current (zonder optimalisatie)

```
Gemiddelde thread: 150 messages × 500 tokens = 75,000 tokens
Claude Sonnet 4 via OpenRouter:
- Input: $3 per 1M tokens = $0.225 per request
- Output: $15 per 1M tokens = $0.075 per request
Total: $0.30 per request

100 users × 5 requests/dag = 500 requests/dag
Cost: $150/dag = $4,500/maand
```

### Met Context Management (optimalisatie)

```
Met intelligent pruning: 40,000 tokens gemiddeld
Cost: $0.12 (input) + $0.075 (output) = $0.195 per request

100 users × 5 requests/dag = 500 requests/dag
Cost: $97.50/dag = $2,925/maand

💰 Saving: $1,575/maand (35% reduction)
```

### Bij Scale (1000 users)

```
Zonder optimalisatie: $45,000/maand
Met optimalisatie: $29,250/maand
💰 Saving: $15,750/maand
```

---

## 🚀 Quick Wins Checklist

**Deze week implementeren**:

- [ ] Context token counting toevoegen
- [ ] Log token usage per request
- [ ] Monitor welke threads >100K tokens
- [ ] Test pruning algorithm op staging

**Volgende sprint**:

- [ ] Implement ContextManager class
- [ ] Deploy naar production
- [ ] Monitor cost savings
- [ ] Optimize pruning parameters

**Later (optioneel)**:

- [ ] Redis caching layer
- [ ] Semantic memory search
- [ ] Performance dashboard
- [ ] A/B testing framework

---

## 📚 Resources

**OpenRouter Docs**:

- [Models lijst](https://openrouter.ai/models)
- [API Reference](https://openrouter.ai/docs/api-reference)
- [Pricing](https://openrouter.ai/docs/pricing)

**Anthropic Claude Docs**:

- [Context Window Info](https://docs.anthropic.com/claude/docs/models-overview)
- [Best Practices](https://docs.anthropic.com/claude/docs/prompt-engineering)

**Internal Docs**:

- `claude-context-management-onderzoek.md` - Volledig onderzoek
- `context-management-implementation-guide.md` - Implementation code

---

## ❓ FAQ

**Q: Heb ik Claude Agent SDK nodig?**  
A: Nee! Je hebt via OpenRouter al volledige Claude toegang.

**Q: Mis ik features zonder native Anthropic API?**  
A: Alleen prompt caching (backend optimization). Voor de rest: alles werkt!

**Q: Moet ik migreren van OpenRouter naar Anthropic direct?**  
A: Absoluut niet. Je verliest dan model flexibility en cost optimization.

**Q: Hoeveel tokens kan ik gebruiken?**  
A: 200,000 tokens = ~600 paginas. Meer dan genoeg voor alle use cases.

**Q: Wat als een thread langer wordt dan 200K tokens?**  
A: Dan helpt de ContextManager met intelligent pruning. Geen probleem!

**Q: Kost dit extra geld?**  
A: Nee, het **bespaart** geld door efficiënter om te gaan met tokens.

---

## ✅ Conclusie

**Je bent klaar om te starten**:

1. ✅ OpenRouter + Claude werkt perfect
2. ✅ 200K context window beschikbaar
3. ✅ Alle features werkend
4. ✅ Implementation guide beschikbaar
5. ✅ Cost savings mogelijk (35%)

**Geen migratie nodig** - alleen optimaliseren van wat je al hebt!

---

_Laatste update: 6 oktober 2025_

