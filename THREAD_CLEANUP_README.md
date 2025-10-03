# Thread History Cleanup Tool

Tool om oude berichten uit threads te verwijderen om performance en kosten te verbeteren.

## Probleem

Threads met veel berichten (>100) worden traag omdat:
- Alle berichten uit database worden geladen
- Volledige history naar OpenRouter/Claude wordt gestuurd
- Meer tokens = hogere kosten en langere response times

## Oplossing

Script dat:
1. ✅ Laatste N berichten behoudt (default: 50)
2. ✅ Oudere berichten verwijdert (inclusief contents via CASCADE)
3. ✅ Controleert op verweesde tool_result messages
4. ✅ Verwijdert automatisch orphaned messages
5. ✅ Werkt voor elke thread/user

## Gebruik

### 1. Lijst alle threads
```bash
ssh easylog-python "cd /app && python cleanup_thread_history.py --list"
```

### 2. Cleanup specifieke thread
```bash
# Interactief (met confirmaties)
ssh easylog-python "cd /app && python cleanup_thread_history.py mumc-3 50"

# Automatisch (zonder confirmaties)
ssh easylog-python "cd /app && python cleanup_thread_history.py mumc-3 50 --auto-confirm"

# Custom aantal berichten behouden
ssh easylog-python "cd /app && python cleanup_thread_history.py heuvel-1 30"
```

## Argumenten

- `external_id` - Thread ID (bijv. 'mumc-3', 'heuvel-1')
- `keep_last_n` - Aantal recente berichten behouden (default: 50)
- `--auto-confirm` - Skip confirmation prompts (optioneel)
- `--list` - Toon alle threads met message counts

## Voorbeelden

```bash
# Toon alle threads
python cleanup_thread_history.py --list

# Cleanup mumc-3, behoud laatste 50 berichten (met confirmatie)
python cleanup_thread_history.py mumc-3 50

# Cleanup heuvel-1, behoud laatste 30 berichten (automatisch)
python cleanup_thread_history.py heuvel-1 30 --auto-confirm
```

## Safety Features

1. **Confirmatie prompts** - Script vraagt bevestiging voordat verwijderen (tenzij --auto-confirm)
2. **Orphaned message detection** - Detecteert en verwijdert verweesde tool_result messages
3. **Preview** - Toont welke berichten verwijderd gaan worden
4. **Cascade delete** - Message contents worden automatisch mee verwijderd

## Output

```
🧹 Thread History Cleanup
   Thread: mumc-3
   Keep last: 50 messages
   Auto-confirm: False

🔍 Looking for thread: mumc-3
✅ Found thread: 65225e52-9456-4489-9403-6ea1b12358fa
📊 Total messages: 101
🗑️  Will delete 51 old messages (keeping last 50)

📋 Messages to delete:
  1. user - 2025-09-15 10:23:15
  2. assistant - 2025-09-15 10:23:18
  ... and 49 more

⚠️  Ready to delete 51 messages...
Continue? (yes/no): yes
✅ Deleted 51 messages

✅ Cleanup complete! Final message count: 50
```

## Aanbevelingen

- **Threads > 100 berichten**: cleanup naar 50 berichten
- **Threads > 200 berichten**: cleanup naar 50 berichten + check memories
- **Periodiek**: elke 2-4 weken threads met >100 berichten opschonen
- **Voor productie users**: altijd eerst memories checken (naam, medicatie, doelen, etc.)

## Technische Details

### Wat wordt verwijderd
- Oude `messages` records
- Bijbehorende `message_contents` (automatisch via ON DELETE CASCADE)

### Wat blijft behouden
- Laatste N berichten (default: 50)
- Alle `memories` (aparte tabel)
- Alle `recurring_tasks` (aparte tabel)
- Alle `reminders` (aparte tabel)
- Alle `health_data_points` (aparte tabel)

### Database Query
Script gebruikt:
```sql
-- Rank messages by date (newest first)
ROW_NUMBER() OVER (ORDER BY created_at DESC)

-- Delete where row_num > keep_last_n
DELETE FROM messages WHERE row_num > 50
```

## Troubleshooting

### Error: "unexpected tool_use_id"
- **Oorzaak**: Eerste bericht is orphaned tool_result
- **Fix**: Script detecteert en verwijdert dit automatisch

### Geen berichten verwijderd
- Check of thread ID correct is met `--list`
- Check of thread meer dan N berichten heeft

## Deploy naar Server

```bash
# Upload script
scp cleanup_thread_history.py easylog-python:/app/

# Maak executable
ssh easylog-python "chmod +x /app/cleanup_thread_history.py"

# Test met --list
ssh easylog-python "cd /app && python cleanup_thread_history.py --list"
```

