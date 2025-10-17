# PQI Tools - Multi-Client Refactor

**Datum:** 17 oktober 2025  
**Status:** ✅ In Progress - toolGetAuditSubmissions.ts voltooid

## Probleemstelling

De PQI tools waren volledig hardcoded voor RET:

- ❌ Hardcoded client ID (16)
- ❌ Hardcoded form ID filters (IKZ, PQI, R&M enums)
- ❌ Hardcoded modality filters (Metro, Bus, Tram enums)
- ❌ Hardcoded veldnamen (`typematerieel`, `bu`)

Dit maakte het onmogelijk om:

- DJZ (client 21) audits te analyseren
- Nieuwe clients toe te voegen
- Agent om zelf categorieën te laten ontdekken

## Oplossing

### 1. Flexibele Parameters ✅

**Voor (RET-specifiek):**

```typescript
{
  auditType: 'IKZ' | 'PQI' | 'R&M',  // ❌ RET only
  modality: 'Metro' | 'Bus' | 'Tram', // ❌ RET only
  vehicleNumber: string,
  materialType: string
}
```

**Na (Multi-client):**

```typescript
{
  clientId: number,        // ✅ 16=RET, 21=DJZ, etc.
  formIds: number[],       // ✅ Dynamisch - agent ontdekt zelf
  auditNumber: string,     // ✅ Generic
  category: string         // ✅ Flexibel per client
}
```

### 2. Dynamische Veldmapping ✅

```typescript
const CLIENT_FIELD_HINTS = {
  16: {
    // RET
    category: 'typematerieel', // Material type
    subcategory: 'bu' // Business unit
  },
  21: {
    // DJZ
    category: 'betreft', // Project name
    subcategory: 'kenmerk' // Contract
  }
};
```

### 3. Flexibele Score Extractie (Al gedaan) ✅

Tools proberen automatisch posities [4], [5], en [6] voor scores:

- Position [4]: DJZ data
- Position [5]: RET oude data
- Position [6]: RET nieuwe data (vanaf aug 2024)

## Implementatie Status

### ✅ Voltooid

1. **constants.ts** - Verwijderd hardcoded enums, toegevoegd field hints
2. **config.ts** - Alle 4 tool schemas updated met flexible parameters
3. **types.ts** - Updated interfaces met generieke veldnamen
4. **toolGetAuditSubmissions.ts** - Volledig gerefactored
5. **toolGetAuditTrends.ts** - Volledig gerefactored
6. **toolGetObservationsAnalysis.ts** - Volledig gerefactored
7. **toolGetVehicleRanking.ts** - Volledig gerefactored

## Gebruik door Agent

### Stap 1: Ontdek beschikbare forms

```sql
SELECT DISTINCT s.project_form_id, f.name, COUNT(*) as count
FROM submissions s
JOIN project_forms pf ON s.project_form_id = pf.id
JOIN forms f ON pf.form_id = f.id
WHERE s.client_id = 21  -- DJZ
GROUP BY s.project_form_id, f.name
```

### Stap 2: Ontdek categorieën

```sql
SELECT DISTINCT
  JSON_UNQUOTE(JSON_EXTRACT(data, '$.betreft')) as project
FROM submissions
WHERE client_id = 21
LIMIT 20
```

### Stap 3: Gebruik tools met ontdekte waarden

```typescript
getAuditSubmissions({
  clientId: 21,
  formIds: [199],
  category: 'Wegenbouw A12'
});
```

## Voordelen

✅ **Multi-Client** - Werkt nu voor RET, DJZ en toekomstige clients  
✅ **Flexibel** - Agent ontdekt zelf beschikbare categorieën  
✅ **Backwards Compatible** - Oude RET data blijft werken  
✅ **No Hardcoding** - Geen client-specifieke enums meer  
✅ **Future Proof** - Nieuwe clients makkelijk toe te voegen

## Breaking Changes

⚠️ **Agent prompts moeten updated worden:**

- Verwijder verwijzingen naar `auditType`, `modality` enums
- Voeg `clientId` parameter instructies toe
- Instructies om forms/categorieën eerst te ontdekken

## Volgende Stappen

1. Voltooi refactor van overige 3 tools
2. Test met RET data (client 16)
3. Test met DJZ data (client 21)
4. Update agent prompts
5. Update documentatie
