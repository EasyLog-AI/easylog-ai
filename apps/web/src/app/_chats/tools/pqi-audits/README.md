# PQI Audits Tools - Universal Multi-Client Support

## Overview

Deze tools ondersteunen **alle PQI audit clients** met een volledig generiek systeem. Geen hardcoded filters meer - tools werken automatisch met elke client configuratie.

## ✨ Nieuwe Architectuur

### Volledig Generiek - Ondersteunt Elke JSON Structuur

**Voorheen:** Hardcoded voor RET

- ❌ Client ID 16 hardcoded
- ❌ Enum filters: `IKZ`, `PQI`, `R&M`
- ❌ Modality filters: `Metro`, `Bus`, `Tram`
- ❌ Hardcoded veldnamen: `auditnummer`, `datum`, `waarnemingen`, `typematerieel`, `bu`

**Nu:** Werkt voor alle clients met elke JSON structuur

- ✅ Dynamic `clientId` parameter
- ✅ Flexible `formIds` array (agent ontdekt zelf)
- ✅ **ALLE velden configureerbaar**: `auditNumber`, `date`, `observations`, `category`, `subcategory`
- ✅ Fallback naar defaults voor nieuwe clients
- ✅ Clients kunnen elke veldnaam gebruiken (bv. `projectnummer` ipv `auditnummer`)

### Ondersteunde Clients

| Client             | ID  | Category Field                  | Subcategory Field        | Auto-Detect             |
| ------------------ | --- | ------------------------------- | ------------------------ | ----------------------- |
| RET                | 16  | `typematerieel` (material type) | `bu` (business unit)     | ✅ Defaults             |
| DJZ                | 21  | `betreft` (project name)        | `kenmerk` (contract)     | ✅ Custom hints         |
| Heuvelgroep        | 22  | `typematerieel` (default)       | `bu` (default)           | ✅ Defaults             |
| **Nieuwe clients** | any | Auto-detect via defaults        | Auto-detect via defaults | ✅ Works automatically! |

### Data Structuren

Alle tools ondersteunen automatisch verschillende waarneming posities:

```typescript
// DJZ (10 velden) - Score op [4]
["category", "aspect", "problem", null, "5", "Positief", ...]

// RET Oud (~10 velden) - Score op [5]
["Locatie", "Systeem", "Component", "Code", "Omschrijving", "10", ...]

// RET Nieuw (15 velden) - Score op [6]
["OP HET DAK", "In-/exterieur", "Waarschuwing", "5535-Code", "Omschrijving", "Waarneming", "1", null, ...]
```

**Flexibele Score Extractie:**

```sql
CASE
  WHEN position[4] is numeric THEN use [4]  -- DJZ
  WHEN position[5] is numeric THEN use [5]  -- Old RET
  WHEN position[6] is numeric THEN use [6]  -- New RET
  ELSE 0
END
```

## 🔧 Tools

Alle 4 tools zijn volledig multi-client:

### 1. getAuditSubmissions

Haal individuele audits op met berekende scores.

### 2. getAuditTrends

Analyseer trends over tijd (maandelijks/wekelijks).

### 3. getObservationsAnalysis

Vind meest voorkomende problemen gegroepeerd per categorie.

### 4. getVehicleRanking

Rangschik voertuigen/projecten op gemiddelde score.

## 📝 Gebruik

### Voor RET (Client 16)

```typescript
// Agent ontdekt forms
const forms = await executeSql(`
  SELECT DISTINCT project_form_id, COUNT(*) as count
  FROM submissions 
  WHERE client_id = 16
  GROUP BY project_form_id
`);

// Gebruik tool
getAuditSubmissions({
  clientId: 16,
  formIds: [122, 125, 127], // Metro PQI forms
  category: 'RSG3', // Material type
  year: 2024
});
```

### Voor DJZ (Client 21)

```typescript
// Ontdek projecten
const projects = await executeSql(`
  SELECT DISTINCT JSON_UNQUOTE(JSON_EXTRACT(data, '$.betreft')) as project
  FROM submissions 
  WHERE client_id = 21
`);

// Gebruik tool
getAuditSubmissions({
  clientId: 21,
  formIds: [199],
  category: 'Wegenbouw A12', // Project name
  year: 2024
});
```

### Voor Nieuwe Client (Auto-detect)

```typescript
// Nieuwe client werkt automatisch met defaults!
getAuditSubmissions({
  clientId: 99, // Nieuwe client
  year: 2024
  // Gebruikt default fields: typematerieel, bu, auditnummer, datum
});
```

## 🎯 Field Mapping

### Default Fields (gebruikt door meeste clients)

```typescript
{
  auditNumber: 'auditnummer',   // Kan zijn: projectnummer, inspectienummer, keuringnummer
  date: 'datum',                 // Kan zijn: inspectiedatum, keuringsdatum
  observations: 'waarnemingen',  // Kan zijn: bevindingen, findings
  category: 'typematerieel',     // Kan zijn: projectnaam, betreft, type
  subcategory: 'bu'              // Kan zijn: locatie, kenmerk, contract
}
```

### Custom Hints (alleen als client afwijkt)

**Minimaal voorbeeld (DJZ):**

```typescript
CLIENT_FIELD_HINTS = {
  21: {
    name: 'DJZ',
    category: 'betreft', // ipv typematerieel
    subcategory: 'kenmerk' // ipv bu
    // auditNumber, date, observations gebruiken defaults
  }
};
```

**Volledig voorbeeld (alle velden anders):**

```typescript
CLIENT_FIELD_HINTS = {
  99: {
    name: 'CustomClient',
    auditNumber: 'projectnummer', // ipv auditnummer
    date: 'inspectiedatum', // ipv datum
    observations: 'bevindingen', // ipv waarnemingen
    category: 'projecttype', // ipv typematerieel
    subcategory: 'locatie' // ipv bu
  }
};
```

## ✅ Voordelen

1. **Universal** - Werkt voor ALLE clients zonder code changes
2. **Fully Flexible JSON** - Elke client kan eigen veldnamen gebruiken
3. **Auto-Discovery** - Agent ontdekt zelf forms en categorieën
4. **Backwards Compatible** - Oude data blijft werken
5. **Future Proof** - Nieuwe clients werken automatisch
6. **Smart Defaults** - 80% van clients hoeft niets te configureren
7. **Score Resilient** - Automatische detectie van score posities [4], [5], [6]

## 📊 Parameters

Alle tools accepteren:

| Parameter     | Type     | Default | Beschrijving                                |
| ------------- | -------- | ------- | ------------------------------------------- |
| `clientId`    | number   | 16      | Client ID (16=RET, 21=DJZ, etc.)            |
| `formIds`     | number[] | null    | Filter op specifieke forms (optioneel)      |
| `auditNumber` | string   | null    | Filter op audit nummer prefix               |
| `category`    | string   | null    | Filter op category veld (varies per client) |
| `year`        | number   | null    | Filter op specifiek jaar                    |
| `limit`       | number   | 10-20   | Maximum aantal resultaten                   |

## 🚀 Nieuwe Client Toevoegen

### Optie 1: Gebruikt Default Fields (meeste clients)

**Geen actie nodig!** Tools werken automatisch.

### Optie 2: Andere Field Names

Voeg entry toe aan `CLIENT_FIELD_HINTS`:

```typescript
export const CLIENT_FIELD_HINTS = {
  // ... bestaande
  99: {
    name: 'NewClient',
    category: 'project_name', // Afwijkend veld
    subcategory: 'location' // Afwijkend veld
    // Rest gebruikt defaults
  }
};
```

## 📅 Change History

### 17 Oktober 2025 v2 - Fully Flexible JSON Support

- ✅ **ALLE velden zijn nu configureerbaar**: `auditNumber`, `date`, `observations`, `category`, `subcategory`
- ✅ Support voor verschillende JSON structuren per client
- ✅ Client kan `projectnummer` gebruiken ipv `auditnummer`
- ✅ Client kan `bevindingen` gebruiken ipv `waarnemingen`
- ✅ 100% flexibel - geen hardcoded field names meer

### 17 Oktober 2025 v1 - Universal Multi-Client Support

- ✅ Verwijderd alle hardcoded RET enums
- ✅ Toegevoegd `clientId` parameter
- ✅ Flexible `formIds` ipv enum filters
- ✅ Dynamic field mapping met fallbacks
- ✅ Alle 4 tools ge-refactored
- ✅ Default fields voor nieuwe clients
- ✅ Backwards compatible met RET/DJZ data

### Eerdere Changes

- Flexibele score extractie (posities [4], [5], [6])
- Fixed 2024 RET data score berekening

## 📚 Files

- `constants.ts` - Field hints en defaults
- `config.ts` - Tool schemas (Zod validation)
- `types.ts` - TypeScript interfaces
- `toolGetAuditSubmissions.ts` - Individuele audits
- `toolGetAuditTrends.ts` - Trend analyses
- `toolGetObservationsAnalysis.ts` - Probleem analyses
- `toolGetVehicleRanking.ts` - Prestatie rankings

---

**No hardcoded clients. No hardcoded fields. Just works.** ✨
