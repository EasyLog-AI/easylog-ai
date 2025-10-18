# Anthropic API Monitoring Guide

Deze gids legt uit hoe je de productie webchat kunt monitoren voor **context management** en **prompt caching** metrics.

## 🎯 Wat Monitoren We?

### 1. Context Management
- **Edit types**: Welke context edits worden toegepast (`clear_tool_uses_20250919`)
- **Messages count**: Aantal berichten in de conversatie
- **System prompt size**: Grootte van de system prompt
- **Tools count**: Aantal beschikbare tools

### 2. Prompt Caching (Cost Optimization)
- **Cache creation tokens**: Nieuwe cache entries (betaald normaal tarief)
- **Cache read tokens**: Cache hits (90% korting! 🎉)
- **Input tokens**: Normale input tokens (betaald volledig)
- **Output tokens**: Gegenereerde tokens (betaald volledig)

## 📊 Cache Efficiency Metrics

### Wat betekenen de getallen?

| Metric | Betekenis | Kosten Impact |
|--------|-----------|---------------|
| `cache_read_tokens: 5000` | 5K tokens gelezen uit cache | 90% goedkoper |
| `cache_creation_tokens: 1000` | 1K tokens nieuw in cache opgeslagen | Normaal tarief |
| `input_tokens: 500` | 500 tokens zonder cache | Normaal tarief |

### Voorbeeld Berekening

**Zonder caching:**
- 6500 input tokens × $0.003/1K = **$0.0195**

**Met caching:**
- 5000 cache reads × $0.0003/1K = $0.0015
- 1000 cache creation × $0.003/1K = $0.0030
- 500 input tokens × $0.003/1K = $0.0015
- **Total: $0.0060** (69% besparing!)

## 🚀 Monitoring Methoden

### Methode 1: Automated Monitoring Script (Aanbevolen)

```bash
# Start monitoring script
./scripts/monitor-anthropic.sh
```

**Wat zie je:**
```
📤 REQUEST:
{
  "model": "claude-3-5-sonnet-20240620",
  "messagesCount": 12,
  "system": "# SYSTEM INSTRUCTIONS...",
  "tools": 15,
  "context_management": {
    "edits": [{"type": "clear_tool_uses_20250919"}]
  }
}

📊 USAGE METRICS:
{
  "input_tokens": 1234,
  "output_tokens": 567,
  "cache_creation_tokens": 8900,
  "cache_read_tokens": 0
}

💰 Cache Impact: 87% cache hit rate
   - Cache reads: 7800 tokens (90% discount)
   - Cache writes: 1100 tokens
```

### Methode 2: Vercel Dashboard (GUI)

1. Ga naar https://vercel.com/easy-log/easylog-ai
2. Klik **"Functions"** in sidebar
3. Selecteer laatste deployment
4. Klik **"Real-time Logs"** rechts bovenaan
5. Zoek naar:
   - `ANTHROPIC API REQUEST` - Zie context management config
   - `ANTHROPIC API USAGE` - Zie caching metrics

### Methode 3: Vercel CLI (Manual)

```bash
# Install Vercel CLI (if not already)
pnpm add -g vercel

# Login (eenmalig)
vercel login

# Monitor live logs
vercel logs easylog-ai --follow

# Filter alleen Anthropic logs
vercel logs easylog-ai --follow | grep "ANTHROPIC"
```

## 🔍 Wat Zoeken We?

### ✅ Goede Tekens (Context Management Werkt)

```json
{
  "context_management": {
    "edits": [{"type": "clear_tool_uses_20250919"}]
  }
}
```
✓ Context management is actief
✓ Tool use history wordt opgeschoond

### ✅ Goede Tekens (Caching Werkt)

**Eerste call (cache creation):**
```json
{
  "input_tokens": 1000,
  "cache_creation_tokens": 8000,  // Nieuwe cache
  "cache_read_tokens": 0
}
```

**Volgende calls (cache hits):**
```json
{
  "input_tokens": 500,
  "cache_creation_tokens": 0,
  "cache_read_tokens": 8500  // 🎉 90% discount!
}
```

### ⚠️ Probleemtekens

**Geen caching:**
```json
{
  "input_tokens": 9000,
  "cache_creation_tokens": 0,
  "cache_read_tokens": 0  // ❌ Geen cache gebruikt
}
```
→ Check of `default_cache_control: true` in database

**Context management ontbreekt:**
```json
{
  // ❌ Geen context_management veld
}
```
→ Check of `contextManagement.enabled: true` in agent config

## 📈 Best Practices

### 1. Cache Warmup Pattern

De eerste message in een conversatie betaalt voor cache creation:
- **Message 1**: `cache_creation_tokens: 8000` (betaal volledig)
- **Message 2+**: `cache_read_tokens: 8000` (betaal 10%)

### 2. Optimale Cache Hit Rate

| Cache Hit % | Rating | Betekenis |
|-------------|--------|-----------|
| 80-100% | 🟢 Excellent | System prompt + tools gecached |
| 50-80% | 🟡 Good | Gedeeltelijke cache hits |
| 0-50% | 🔴 Poor | Check cache configuration |

### 3. Monitoring Frequency

- **Development**: Real-time monitoring tijdens testen
- **Staging**: Dagelijkse checks
- **Production**: Weekly reports + alerts bij anomalieën

## 🛠️ Troubleshooting

### Cache werkt niet

**Check 1: Database configuratie**
```sql
SELECT id, name, default_cache_control 
FROM agents 
WHERE slug = 'easylog';
```
Moet zijn: `default_cache_control: true` ✓

**Check 2: Provider is Anthropic**
```sql
SELECT id, name, default_provider 
FROM agents 
WHERE slug = 'easylog';
```
Moet zijn: `default_provider: anthropic` ✓

**Check 3: Code configuratie**
Bestand: `apps/web/src/app/(routes)/api/[agentSlug]/chat/route.ts`

Regel 220-222:
```typescript
const cacheControl = {
  enabled: activeRole?.cacheControl ?? chat.agent.defaultCacheControl
};
```

### Context Management werkt niet

**Check: Beta header**
Bestand: `apps/web/src/lib/ai-providers/factories/anthropic-factory.ts`

Moet hebben:
```typescript
headers: {
  'anthropic-beta': 'context-management-2025-06-27'
}
```

**Check: Context management edits**
```typescript
body.context_management = {
  edits: [{ type: 'clear_tool_uses_20250919' }]
};
```

## 📝 Reporting Template

```markdown
# Anthropic API Monitoring Report - [Date]

## Agent Info
- Name: Easylog
- Model: claude-3-5-sonnet-20240620
- Provider: anthropic
- Cache Control: ✓ enabled

## Cache Performance
- Total conversations analyzed: [X]
- Average cache hit rate: [X]%
- Cost savings: €[X] ([X]%)

## Context Management
- Context edits active: ✓ clear_tool_uses_20250919
- Average messages per conversation: [X]
- Average tokens per request: [X]

## Issues / Observations
[Eventuele problemen of opmerkingen]
```

## 🔗 Referenties

- **Anthropic Caching Docs**: https://docs.anthropic.com/claude/docs/prompt-caching
- **Context Management Beta**: https://docs.anthropic.com/claude/docs/context-management
- **Vercel Logs**: https://vercel.com/docs/observability/logs
- **EasyLog Agent DB**: Neon project `still-wind-33703124`

## Agent Configuratie (Current)

```json
{
  "id": "a744cb77-6ab1-429c-8449-a13e76f378b4",
  "name": "Easylog",
  "slug": "easylog",
  "default_model": "claude-3-5-sonnet-20240620",
  "default_provider": "anthropic",
  "default_reasoning": false,
  "default_cache_control": true,  // ✓ Caching enabled
  "capabilities": {
    "sql": false,
    "core": true,
    "charts": true,
    "memories": true,
    "planning": false,
    "followUps": true,
    "pqiAudits": true,
    "submissions": true,
    "knowledgeBase": true,
    "multipleChoice": true
  }
}
```

---

*Laatste update: 18 oktober 2025*
*Voor vragen of problemen, check Instructies/03-Web-Application/ docs*

