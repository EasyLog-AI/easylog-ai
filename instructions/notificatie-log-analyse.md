# Notificatie Log Analyse Instructies

## Overzicht

Deze instructies helpen bij het analyseren van notificatie logs in het EasyLog AI systeem, specifiek voor het onderzoeken van super agent activiteit en recurring task uitvoering.

## Systeem Architectuur

### Super Agent Configuratie

- **MUMC Agent**: Draait elk uur (`0 * * * *`)
- **EasyLog Agent**: Draait elke 3 uur (`0 */3 * * *`)
- **Debug Agent**: Draait elke 2 uur (`0 */2 * * *`)

### Notificatie Flow

1. **Super Agent** draait op schema (cron-based)
2. **Thread Identificatie**: Zoekt naar meest recente thread per OneSignal ID
3. **Cron Evaluatie**: Controleert recurring tasks tegen huidige tijd
4. **Duplicate Preventie**: Checkt previously sent notifications
5. **Tool Selectie**: `tool_send_notification` of `tool_noop`

## Log Analyse Commands

### 1. Basis Server Log Monitoring

```bash
# Live monitoring
ssh easylog-python "docker logs easylog-python-server.api -f"

# Specifieke tijdsperiode
ssh easylog-python "docker logs easylog-python-server.api --since '2025-08-30T19:00:00' --until '2025-08-30T20:00:00'"
```

### 2. Notificatie Specifieke Logs

```bash
# Zoek naar notificatie activiteit
ssh easylog-python "docker logs easylog-python-server.api | grep -E '(super agent|notification|tool_noop|tool_send_notification)'"

# Zoek naar specifieke tijd
ssh easylog-python "docker logs easylog-python-server.api | grep '19:00' | grep -E '(notification|super agent)'"
```

### 3. Super Agent Activiteit

```bash
# Super agent registratie en uitvoering
ssh easylog-python "docker logs easylog-python-server.api | grep -E '(Running super agent|Calling super agent|Super agent response)'"

# Agent specifieke logs
ssh easylog-python "docker logs easylog-python-server.api | grep -E '(MUMCAgent|EasyLogAgent|DebugAgent)'"
```

### 4. Thread en User Identificatie

```bash
# Zoek naar specifieke thread activiteit
ssh easylog-python "docker logs easylog-python-server.api | grep 'eb653b06-e676-46ad-916d-047bc743470a'"

# Zoek naar user activiteit
ssh easylog-python "docker logs easylog-python-server.api | grep 'staging2-8'"
```

## Analyse Stappen

### Stap 1: Identificeer de Context

1. **Welke agent?** (MUMC, EasyLog, Debug)
2. **Welke tijd?** (exacte timestamp)
3. **Welke user?** (OneSignal external user ID)
4. **Welke thread?** (thread ID)

### Stap 2: Controleer Super Agent Uitvoering

```bash
# Zoek naar super agent logs rond specifieke tijd
ssh easylog-python "docker logs easylog-python-server.api --since '[TIJD-5MIN]' --until '[TIJD+5MIN]' | grep -E '(super agent|MUMCAgent)'"
```

### Stap 3: Analyseer Recurring Tasks

Zoek in logs naar:

- `recurring_tasks` metadata
- Cron expression evaluatie
- `tool_send_notification` calls
- `tool_noop` calls

### Stap 4: Verificeer Notificatie Delivery

Zoek naar:

- `Sending notification to [onesignal_id]`
- `Notification response: {response}`
- Error logs bij OneSignal API calls

## Veelvoorkomende Patronen

### Succesvolle Notificatie

```
INFO - Running super agent MUMCAgent for thread [thread_id]
INFO - Calling super agent with prompt: [notification_prompt]
INFO - Sending notification to [onesignal_id]
INFO - Notification response: {"id": "[notification_id]", ...}
INFO - Super agent response: [tool_send_notification_call]
```

### Geen Notificatie (tool_noop)

```
INFO - Running super agent MUMCAgent for thread [thread_id]
INFO - Calling super agent with prompt: [notification_prompt]
INFO - Super agent response: [tool_noop_call]
```

### Thread Mismatch (Skip)

```
INFO - Last thread id does not match current thread id, skipping super agent call
```

### Missing OneSignal ID (Skip)

```
INFO - No onesignal id found, skipping super agent call
```

## Troubleshooting Guide

### Probleem: Notificaties Niet Verstuurd

#### 1. Controleer Super Agent Registratie

```bash
ssh easylog-python "docker logs easylog-python-server.api | grep 'Registered super agent'"
```

#### 2. Controleer Thread Matching

```bash
# Zoek naar thread mismatch logs
ssh easylog-python "docker logs easylog-python-server.api | grep 'thread id does not match'"
```

#### 3. Controleer OneSignal Configuratie

```bash
# Zoek naar OneSignal errors
ssh easylog-python "docker logs easylog-python-server.api | grep -E '(onesignal|OneSignal)' | grep -E '(error|Error)'"
```

#### 4. Controleer Cron Evaluatie

Analyseer super agent prompt in logs voor:

- Current time formatting
- Cron expression matching logic
- Previously sent notifications check

### Probleem: Duplicate Notificaties

#### Controleer Metadata

Zoek naar:

- Multiple super agent runs binnen kort tijdsbestek
- Incorrecte cron expressions (te breed)
- Ontbrekende duplicate detection

## Voorbeeld Analyse

### Scenario: Recurring Task Niet Getriggerd

1. **Zoek Super Agent Logs**:

   ```bash
   ssh easylog-python "docker logs easylog-python-server.api --since '2025-08-30T19:00:00' --until '2025-08-30T19:05:00' | grep 'MUMCAgent'"
   ```

2. **Controleer Cron Logic**:

   - Huidige tijd: `2025-08-30 19:00:10` (zaterdag)
   - Task cron: `0 19 * * *` → ✅ Match (elke dag 19:00)
   - Task cron: `0 * * * *` → ✅ Match (elk uur)

3. **Controleer Previously Sent**:
   Zoek in super agent prompt naar notification history

4. **Verificeer Tool Call**:
   - `tool_send_notification` → Notificatie verstuurd
   - `tool_noop` → Geen actie (meestal correct)

## Nuttige Log Patterns

### Super Agent Execution

```
Running super agent [AgentClass] for [X] threads
Running super agent [AgentClass] for thread [thread_id]
```

### Notification Metadata

```
Your recurring tasks are:
- [task_id]: [cron] - [description]

You've sent the following notifications in the past:
: [title] at [timestamp]
```

### OneSignal Integration

```
Sending notification to [onesignal_id] with app id [app_id]
Notification: [notification_object]
Notification response: [response]
```

## Best Practices

1. **Start Breed**: Begin met algemene super agent logs
2. **Verfijn Zoektermen**: Gebruik specifieke tijden en thread IDs
3. **Controleer Context**: Bekijk logs voor en na de target tijd
4. **Verificeer Metadata**: Controleer thread metadata voor recurring tasks
5. **Trace Complete Flow**: Van super agent trigger tot notification delivery

## Veelvoorkomende Oorzaken

### Waarom Notificaties Niet Aankomen

1. **Thread Mismatch**: Super agent draait op verkeerde thread
2. **OneSignal ID Missing**: Gebruiker niet correct geregistreerd
3. **App Permissions**: Flutter app heeft geen notificatie rechten
4. **Cron Mismatch**: Verkeerde interpretatie van cron expression
5. **Already Sent**: Duplicate detection werkt correct

### Waarom tool_noop

1. **Correct Gedrag**: Notificaties al verstuurd vandaag/dit uur
2. **Geen Match**: Cron expression matcht niet met huidige tijd
3. **Lege Tasks**: Geen recurring tasks of reminders geconfigureerd

## Monitoring Tips

- **Real-time**: Gebruik `-f` flag voor live log monitoring
- **Tijdzones**: Logs zijn in UTC, notificaties in Europe/Amsterdam
- **Thread Context**: Elke user kan meerdere threads hebben
- **Agent Types**: Verschillende agents hebben verschillende super agent intervallen

---

_Laatst bijgewerkt: 30 Augustus 2025_
_Voor vragen: raadpleeg de EasyLog AI documentatie_
