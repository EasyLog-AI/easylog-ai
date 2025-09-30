# MUMC Agent Testing - Handleiding

## 🎯 Doel

Dit test framework simuleert gebruikers conversaties met de MUMC agents en valideert:
- ✅ Correcte tool calls
- ✅ Juiste parameters
- ✅ Response kwaliteit
- ✅ Prompt adherence
- ✅ Metadata updates

---

## 📁 Bestanden

- `test_mumc_agent_conversation.py` - Hoofd test script
- `test_reports/` - Gegenereerde test rapporten (markdown)

---

## 🚀 Gebruik

### Lokaal Testen (Development)

```bash
cd /Users/ewoutdijck/Projecten_AI/easylog-ai/apps/api

# Zorg dat de API draait op localhost:8000
# Dan run:
python tests/test_mumc_agent_conversation.py
```

### Remote Testen (Staging)

Pas in het script aan:
```python
API_BASE_URL = "https://staging2.easylog.nu/ai"
```

---

## 🧪 Test Cases

### Huidige Tests

1. **Reminder Creation Test**
   - User: "Stuur me elke dag om 20:00 een wandel reminder"
   - Verwacht: `tool_set_recurring_task` met cron `0 20 * * *`

2. **One-time Reminder Test**
   - User: "Herinner me morgen om 10:00 aan medicatie"
   - Verwacht: `tool_add_reminder` met medicatie in message

3. **Memory Storage Test**
   - User: "Ik ben 65 jaar oud"
   - Verwacht: `tool_store_memory` met leeftijd info

### Nieuwe Tests Toevoegen

```python
TEST_CONVERSATIONS.append({
    "name": "Your Test Name",
    "description": "What this tests",
    "messages": [
        {
            "user_input": "Test user message",
            "expected_tool": "tool_name",
            "expected_params": {"key": "value"},
            # Of:
            "expected_params_contains": ["keyword1", "keyword2"],
        }
    ],
})
```

---

## 📊 Output

### Console Output

```
╔══════════════════════════════════════════════════════════════╗
║          MUMC Agent Conversation Tester                      ║
╚══════════════════════════════════════════════════════════════╝

🔧 Initializing test environment...
📍 API Base URL: http://localhost:8000
🧪 Test Thread ID: test-mumc-agent-20250930-203000

✅ Test thread created: abc123...

============================================================
🧪 Test: Reminder Creation Test
📝 Test if agent correctly creates a daily reminder
============================================================

💬 User: Stuur me elke dag om 20:00 een wandel reminder
🤖 Assistant: Geregeld! Je krijgt nu elke dag om 20:00...
🔧 Tools called: ['tool_set_recurring_task']
✅ Correct tool called: tool_set_recurring_task
✅ Parameter 'cron_expression' correct: 0 20 * * *

============================================================

# MUMC Agent Test Report

**Date**: 2025-09-30 20:30:00
**Agent**: MUMCAgentTest
**Success Rate**: 100.0%

### Reminder Creation Test ✅
No issues found.
```

### Markdown Report

Opgeslagen in `test_reports/mumc_agent_test_YYYYMMDD_HHMMSS.md`

---

## 🔍 Wat wordt getest?

### Tool Calling
- ✅ Wordt de juiste tool aangeroepen?
- ✅ Zijn de parameters correct?
- ✅ Bevatten parameters de verwachte keywords?

### Response Quality
- ✅ Geeft agent een response in Nederlands?
- ✅ Is de response relevant voor de user input?
- ✅ Volgt agent de prompt instructions?

### Metadata
- ✅ Worden reminders opgeslagen in thread metadata?
- ✅ Worden memories correct vastgelegd?
- ✅ Worden recurring tasks aangemaakt?

---

## ⚙️ Configuratie

### Test Agent Settings

**Agent**: `MUMCAgentTest`
- **Super Agent Interval**: 4 uur (`0 */4 * * *`)
- **Runs at**: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00
- **Logging**: `[TEST AGENT]` prefix
- **Features**: Notification-to-chat, ZLM charts, medication reminders

### Productie Agent (Ter Vergelijking)

**Agent**: `MUMCAgent`
- **Super Agent Interval**: 15 minuten (`*/15 * * * *`)
- **Features**: Identiek aan test agent

---

## 🐛 Known Issues

### Duplicate Reminders
`tool_add_reminder` heeft geen duplicate checking. Dit kan leiden tot duplicate reminders als de tool meerdere keren wordt aangeroepen.

**Oplossing**: Zie memory ID 9488419

### Test Thread Cleanup
Test threads blijven in de database. Periodiek opschonen kan nodig zijn.

**Oplossing**: Voeg cleanup step toe aan test script.

---

## 💡 Uitbreidingen

### Toekomstige Features

1. **Full Flow Tests**
   - Volledige intake proces
   - ZLM questionnaire completion
   - Goal setting workflow

2. **Edge Case Tests**
   - Ongeldige input
   - Missing metadata
   - Error scenarios

3. **Performance Tests**
   - Response time measurement
   - Tool call latency
   - Database query performance

4. **Automated CI/CD**
   - Run tests bij elke commit
   - Automatic report generation
   - Slack/email notifications bij failures

### Integration Tests

```python
# Test super agent notification flow
async def test_super_agent_notification():
    # 1. Create reminder
    # 2. Wait for super agent run (mock time?)
    # 3. Verify notification in metadata
    # 4. Verify chat message created
    # 5. Verify push notification sent
```

---

## 📝 Best Practices

1. **Isolatie**: Gebruik altijd aparte test threads
2. **Cleanup**: Verwijder test data na tests
3. **Logging**: Gebruik `[TEST]` prefix in alle test logs
4. **Timing**: Test agent draait elke 4 uur om overlap te voorkomen
5. **Validatie**: Check zowel tool calls als responses

---

## 🆘 Troubleshooting

### Test faalt met "Connection refused"
→ Check of API server draait op `localhost:8000`

### Tool niet aangeroepen
→ Check of prompt correct is in TEST_AGENT_CONFIG

### 422 Validation Error
→ Check of request body correct is formatted

### Geen tool calls in response
→ Agent heeft mogelijk niet de tools beschikbaar (check tools_regex)

---

**Created by**: AI Assistant  
**Last Updated**: 30 september 2025  
**Version**: 1.0

