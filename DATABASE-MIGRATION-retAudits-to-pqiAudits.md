# Database Migration: retAudits → pqiAudits

**Date:** 17 oktober 2025  
**Branch:** `ewout17oktober`

## Context

PQI tools (Product Quality Index - productaudit voor kwaliteitsevaluatie) waren verkeerd benoemd als "RET" tools, wat suggereerde dat ze RET-specifiek waren. Dit zijn algemene productaudit tools die door meerdere klanten kunnen worden gebruikt.

## Code Changes (Already Applied)

✅ Folder renamed: `ret-audits/` → `pqi-audits/`  
✅ Capability renamed: `retAudits` → `pqiAudits`  
✅ TypeScript types updated  
✅ Tool imports updated  
✅ Documentation updated

## Database Migration Required

**Neon Database: `still-wind-33703124` (production)**

### Query to Update Agent Capabilities

```sql
-- Update all agents that have retAudits capability
UPDATE agents
SET capabilities = capabilities - 'retAudits' || jsonb_build_object('pqiAudits', (capabilities->>'retAudits')::boolean)
WHERE capabilities ? 'retAudits';

-- Verify the changes
SELECT
  id,
  name,
  slug,
  capabilities->>'pqiAudits' as pqi_audits,
  capabilities->>'retAudits' as old_ret_audits_should_be_null
FROM agents
WHERE capabilities ? 'pqiAudits' OR capabilities ? 'retAudits';
```

### Expected Results

**Before:**

```json
{
  "capabilities": {
    "core": true,
    "charts": true,
    "retAudits": true
  }
}
```

**After:**

```json
{
  "capabilities": {
    "core": true,
    "charts": true,
    "pqiAudits": true
  }
}
```

## Affected Agents

Agents met `retAudits: true` capability moeten gemigreerd worden. Typisch:

- RET agent (gebruikt PQI voor voertuig audits)
- Eventuele andere agents die productaudits gebruiken

## Testing After Migration

1. **Check agent capabilities:**

   ```sql
   SELECT id, name, slug, capabilities
   FROM agents
   WHERE capabilities ? 'pqiAudits';
   ```

2. **Test in web app:**

   - Open agent chat met PQI capability
   - Verify tools zijn beschikbaar
   - Test tool calls werken correct

3. **Verify no old references:**
   ```sql
   SELECT id, name FROM agents WHERE capabilities ? 'retAudits';
   ```
   → Should return 0 rows

## Rollback (if needed)

```sql
UPDATE agents
SET capabilities = capabilities - 'pqiAudits' || jsonb_build_object('retAudits', (capabilities->>'pqiAudits')::boolean)
WHERE capabilities ? 'pqiAudits';
```

## Deployment Checklist

- [ ] Code changes committed to `ewout17oktober` branch
- [ ] Database migration executed on production
- [ ] Verification queries run successfully
- [ ] Web app tested with PQI-enabled agents
- [ ] Documentation updated
- [ ] Branch merged to main

---

**Status:** Ready for database migration  
**Risk:** Low (simple rename, no data loss)
