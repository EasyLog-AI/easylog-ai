-- SQL Script to Update Agent Chart Instructions in Neon Database
-- ================================================================
-- This script updates complex chart instructions with simplified versions
-- Run this on your Neon database to update all agent prompts

-- BACKUP FIRST! Create a backup of your agent configurations
-- SELECT * FROM agent_configs INTO agent_configs_backup_[date];

-- Find agents with the old complex chart instructions
SELECT 
    id,
    name,
    SUBSTRING(prompt, POSITION('Chart Creation Instructions' IN prompt), 500) as chart_instruction_preview
FROM agent_configs
WHERE prompt LIKE '%PIE CHARTS: Use ONE shared dataKey%'
   OR prompt LIKE '%Chart Creation Instructions:%Always use this JSON structure%';

-- Update the complex instructions with simplified version
-- IMPORTANT: Review this query carefully before running!
UPDATE agent_configs
SET prompt = REPLACE(
    REPLACE(
        prompt,
        -- Old pattern 1: The super complex instruction
        '**Chart Creation Instructions:** Always use this JSON structure: {"data": [{"key": value}], "type": "bar|stacked-bar|line|pie", "series": [{"dataKey": "columnName", "label": "Clear Label (units)", "color": "var(--color-chart-1-5)|#HEX|rgb()"}], "xAxisKey": "categoryColumn"}. Rules: PIE CHARTS: Use ONE shared dataKey for ALL segments with multiple colors in values array; other charts use descriptive column names with multiple series for grouped/stacked bars or multiple lines. Bar = grouped side-by-side, stacked-bar = vertical stack, line = separate lines. Include units in labels, ensure numeric data, consistent structure, max 7 pie segments, 3–12 data points recommended. Colors: var(--color-chart-1) through var(--color-chart-5) or custom hex/rgb.',
        -- New simplified instruction
        '**Chart Creation:** Create charts with this structure: {"type": "bar|stacked-bar|line|pie", "data": [{"category": "name", "value": number}], "xAxisKey": "category", "values": [{"dataKey": "value", "label": "Label", "color": "var(--color-chart-1)"}]}. Use colors: var(--color-chart-1) through var(--color-chart-5).'
    ),
    -- Old pattern 2: Alternative format with newlines
    'Always return charts using this JSON structure: {"data": [{"key": value}], "type": "bar|stacked-bar|line|pie", "series": [{"dataKey": "columnName", "label": "Clear Label (units)", "color": "var(--color-chart-1-5)|#HEX|rgb()"}], "xAxisKey": "categoryColumn"}
Rules:
PIE CHARTS: Use ONE shared dataKey for ALL segments. Data structure: [{"category": "Type A", "value": 180}, {"category": "Type B", "value": 120}]. Series: ONE entry with the shared dataKey: [{"dataKey": "value", "label": "Count", "color": "var(--color-chart-1)"}]. Multiple colors per segment are defined in the values array, NOT in separate series entries.
Bar (grouped), stacked-bar, and line charts use descriptive column names; include multiple series when appropriate.
Include measurement units in series labels and ensure values are numeric.
Keep structure consistent; prefer a maximum of 7 pie segments and 3–12 data points.
Y-axis labels: max 10 characters; abbreviate if longer (apply clear truncation like "Observaties" → "Observat…").
Colors: use var(--color-chart-1) through var(--color-chart-5) or custom HEX/RGB; prefer pastel tones.',
    -- New simplified instruction
    '**Chart Creation:** Create charts with this structure: {"type": "bar|stacked-bar|line|pie", "data": [{"category": "name", "value": number}], "xAxisKey": "category", "values": [{"dataKey": "value", "label": "Label", "color": "var(--color-chart-1)"}]}. Use colors: var(--color-chart-1) through var(--color-chart-5).'
)
WHERE prompt LIKE '%PIE CHARTS: Use ONE shared dataKey%'
   OR prompt LIKE '%Chart Creation Instructions:%Always use this JSON structure%';

-- Verify the updates
SELECT 
    id,
    name,
    CASE 
        WHEN prompt LIKE '%PIE CHARTS: Use ONE shared dataKey%' THEN 'Still has old instructions'
        WHEN prompt LIKE '%Chart Creation:** Create charts%' THEN 'Updated successfully'
        ELSE 'No chart instructions found'
    END as status
FROM agent_configs
WHERE prompt LIKE '%Chart Creation%';
