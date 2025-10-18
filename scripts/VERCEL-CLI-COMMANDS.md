# Vercel CLI Commands - Live Logs

## ✅ Juiste Commando's

### Optie 1: Via Project Link

```bash
cd /Users/ewoutdijck/Projecten_AI/easylog-ai/apps/web

# Link project (eenmalig)
vercel link

# Dan: monitor logs
vercel logs
```

### Optie 2: Via Direct Deployment URL

```bash
# Gebruik deployment URL in plaats van project naam
vercel logs https://easylog-lodal7fvz-easy-log.vercel.app
```

### Optie 3: Via Team + Project Specificatie

```bash
# Specificeer team en project expliciet
vercel logs --scope easy-log --project easylog-ai
```

## 🎯 Wat Werkt (Getest):

```bash
cd /Users/ewoutdijck/Projecten_AI/easylog-ai/apps/web
vercel link
# Kies: EasyLog team
# Kies: easylog-ai project
# Kies: .vercel/project.json opslaan

# Nu werken logs
vercel logs
```

## 🔍 Filter Op ANTHROPIC:

```bash
# Real-time monitoring
vercel logs | grep ANTHROPIC

# Of met kleuren
vercel logs | grep --color=always ANTHROPIC

# Laatste 100 entries
vercel logs --output raw | grep ANTHROPIC
```

## 📊 Verwachte Output:

```
ANTHROPIC API REQUEST: {"model":"claude-sonnet-4-5-20250929","messagesCount":2,"tools":15}
ANTHROPIC API USAGE: {"input_tokens":1234,"cache_creation_tokens":8900,"cache_read_tokens":0}
ANTHROPIC API USAGE: {"input_tokens":678,"cache_creation_tokens":0,"cache_read_tokens":9100}
```
