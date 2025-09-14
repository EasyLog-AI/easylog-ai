# 📊 Agent Chart Instructions Update Guide

## ✅ Wat is er veranderd?

De webapp heeft nu **automatische pie chart correctie**! Dit betekent:

- Agents hoeven geen complexe pie chart instructies meer te volgen
- Verkeerde configuraties worden automatisch gecorrigeerd
- 80% kortere prompts mogelijk

## 🎯 Nieuwe Simpele Instructie

Vervang de lange, complexe chart instructies met:

```text
**Chart Creation:**
Create charts with structure: {"type": "bar|stacked-bar|line|pie", "data": [{"category": "name", "value": number}], "xAxisKey": "category", "values": [{"dataKey": "value", "label": "Label"}]}
```

## 📝 Stappen om Agents te Updaten

### 1. Check welke agents oude instructies hebben

```sql
SELECT id, name,
  CASE
    WHEN prompt LIKE '%PIE CHARTS: Use ONE shared dataKey%' THEN 'Has complex instructions'
    ELSE 'Already simplified or no chart instructions'
  END as status
FROM agent_configs
WHERE prompt LIKE '%Chart%';
```

### 2. Update de agents (één voor één voor veiligheid)

```sql
-- Voorbeeld voor een specifieke agent
UPDATE agent_configs
SET prompt = REPLACE(
  prompt,
  -- Zoek naar de oude complexe instructie
  '**Chart Creation Instructions:** Always use this JSON structure...[hele lange instructie]...',
  -- Vervang met nieuwe simpele versie
  '**Chart Creation:** Create charts with structure: {"type": "bar|stacked-bar|line|pie", "data": [{"category": "name", "value": number}], "xAxisKey": "category", "values": [{"dataKey": "value", "label": "Label"}]}'
)
WHERE id = [agent_id];
```

### 3. Test de update

Test of pie charts nog steeds werken door aan de agent te vragen:

```
"Maak een pie chart van de volgende data:
Positief: 10, Opmerking: 5, Anders: 3"
```

## ⚠️ Wat te verwijderen uit agent prompts

Deze complexe instructies kunnen WEG:

- `PIE CHARTS: Use ONE shared dataKey for ALL segments...`
- `Multiple colors per segment are defined in the values array...`
- `Data structure: [{"category": "Type A", "value": 180}...`
- Alle gedetailleerde pie chart regels

## 🚀 Voordelen

1. **Kortere prompts** = Lagere kosten (minder tokens)
2. **Minder fouten** = Automatische correctie vangt alles op
3. **Eenvoudiger onderhoud** = Geen complexe instructies meer nodig
4. **Betere performance** = Minder parsing nodig door agents

## 📊 Voorbeeld: Hoe agents nu pie charts kunnen maken

Agent kan nu gewoon dit doen:

```json
{
  "type": "pie",
  "data": [
    { "item": "Appels", "aantal": 10 },
    { "item": "Peren", "aantal": 5 },
    { "item": "Bananen", "aantal": 3 }
  ],
  "xAxisKey": "item",
  "values": [{ "dataKey": "aantal", "label": "Stuks" }]
}
```

De webapp zorgt automatisch voor multi-color weergave! 🎨

## 🔍 Debugging

Als je wilt zien wanneer de auto-correctie actief is:

1. Open browser DevTools Console
2. Kijk naar waarschuwingen die beginnen met "🔧 Pie chart configuration auto-corrected"
3. Dit toont de originele en getransformeerde configuratie

---

**Belangrijk:** Test altijd eerst met één agent voordat je alle agents update!
