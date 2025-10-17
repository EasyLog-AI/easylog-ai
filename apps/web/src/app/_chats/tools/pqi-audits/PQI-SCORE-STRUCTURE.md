# PQI Score Structure - Complete Guide

## 📊 Score Types

PQI audits hebben 3 categorieën waarnemingen:

### 1. Numerieke Scores (Met Prioriteit)

| Score  | Ernst        | Actie                  |
| ------ | ------------ | ---------------------- |
| **1**  | Licht        | Minimale actie vereist |
| **5**  | Matig        | Aandacht nodig         |
| **10** | Ernstig      | Spoedige actie vereist |
| **20** | Zeer ernstig | Kritieke bevinding     |

### 2. Positieve Bevindingen

- Score veld = **"Anders"**
- Volgend veld = **"Positief"**
- Betekenis: Goede bevinding, iets dat goed gaat
- Telt NIET mee in `audit_score`

### 3. Opmerkingen

- Score veld = **"Anders"**
- Volgend veld = **"Opmerking"**
- Betekenis: Algemene opmerking zonder prioriteit
- Telt NIET mee in `audit_score`

## 🔍 Data Structuur Voorbeelden

### DJZ Structuur (10 velden) - Score op [4]

```javascript
// Numerieke score
["Category", "Aspect", "Problem", null, "5", "Details", ...]
//                                         ^^^
//                                       Score [4]

// Positieve bevinding
["Category", "Aspect", "Problem", null, "Anders", "Positief", ...]
//                                       ^^^^^^^   ^^^^^^^^^
//                                     Score [4]  Type [5]

// Opmerking
["Category", "Aspect", "Problem", null, "Anders", "Opmerking", ...]
//                                       ^^^^^^^   ^^^^^^^^^^
//                                     Score [4]  Type [5]
```

### RET Oud (~10 velden) - Score op [5]

```javascript
// Numerieke score
["Locatie", "Systeem", "Component", "Code", "Omschrijving", "10", ...]
//                                                            ^^^^
//                                                          Score [5]

// Positieve bevinding
["Locatie", "Systeem", "Component", "Code", "Omschrijving", "Anders", "Positief", ...]
//                                                            ^^^^^^^   ^^^^^^^^^
//                                                          Score [5]  Type [6]

// Opmerking
["Locatie", "Systeem", "Component", "Code", "Omschrijving", "Anders", "Opmerking", ...]
//                                                            ^^^^^^^   ^^^^^^^^^^
//                                                          Score [5]  Type [6]
```

### RET Nieuw (15 velden) - Score op [6]

```javascript
// Numerieke score
["OP HET DAK", "In-/exterieur", "Waarschuwing", "5535-Code", "Omschrijving", "Waarneming", "1", null, ...]
//                                                 ^^^^                                        ^^^
//                                               Code [3]                                   Score [6]

// Positieve bevinding
["OP HET DAK", "Systeem", "Component", "5535", "Omschrijving", "Waarneming", "Anders", "Positief", ...]
//                                       ^^^^                                   ^^^^^^^   ^^^^^^^^^
//                                     Code [3]                               Score [6]  Type [7]

// Opmerking
["OP HET DAK", "Systeem", "Component", "5535", "Omschrijving", "Waarneming", "Anders", "Opmerking", ...]
//                                       ^^^^                                   ^^^^^^^   ^^^^^^^^^^
//                                     Code [3]                               Score [6]  Type [7]
```

## ⚙️ Score Extraction Logic

### 1. audit_score (Numerieke scores)

```sql
CASE
  WHEN position[4] IN ('1', '5', '10', '20') THEN [4]
  WHEN position[5] IN ('1', '5', '10', '20') THEN [5]
  WHEN position[6] IN ('1', '5', '10', '20') THEN [6]
  ELSE 0
END
```

**Let op:**

- ✅ Telt alleen 1, 5, 10, 20
- ❌ Negeert "Anders"
- ❌ Negeert code nummers (zoals "5535")

### 2. positives (Positieve bevindingen)

```sql
COUNT WHERE
  ([4] = 'Anders' AND [5] = 'Positief')
  OR ([5] = 'Anders' AND [6] = 'Positief')
  OR ([6] = 'Anders' AND [7] = 'Positief')
```

**Let op:**

- Vereist PATROON: "Anders" gevolgd door "Positief"
- Checkt voorafgaande positie voor "Anders"
- Telt alleen als beide condities kloppen

### 3. remarks (Opmerkingen)

```sql
COUNT WHERE
  ([4] = 'Anders' AND [5] = 'Opmerking')
  OR ([5] = 'Anders' AND [6] = 'Opmerking')
  OR ([6] = 'Anders' AND [7] = 'Opmerking')
```

**Let op:**

- Vereist PATROON: "Anders" gevolgd door "Opmerking"
- Checkt voorafgaande positie voor "Anders"
- "Anders" zelf wordt NIET geteld
- Telt alleen als beide condities kloppen

## 📈 Tool Output

### getAuditSubmissions

```json
{
  "audit_number": "5633-2024-11-18",
  "observations": 25,
  "audit_score": 125, // Som van alleen 1,5,10,20
  "positives": 3, // Aantal "Positief"
  "remarks": 5 // Aantal "Opmerking"
}
```

**Interpretatie:**

- 25 waarnemingen totaal
- 125 punten aan problemen (17 waarnemingen met scores)
- 3 positieve bevindingen
- 5 algemene opmerkingen

### getVehicleRanking

```json
{
  "category": "RSG3",
  "total_audits": 50,
  "avg_score": 82.5, // Gemiddelde score per audit
  "total_score": 4125, // Totale score alle audits
  "total_positives": 45, // Totaal positieve bevindingen
  "total_remarks": 120 // Totaal opmerkingen
}
```

## 🎯 Validation Rules

### Score Field Validation

```typescript
// VALID PQI SCORES
✅ "1"      → Licht
✅ "5"      → Matig
✅ "10"     → Ernstig
✅ "20"     → Zeer ernstig
✅ "Anders" → Geen score (check volgend veld)

// INVALID (worden genegeerd)
❌ "0"      → Niet in gebruik
❌ "2"      → Niet in gebruik
❌ "5535"   → Code nummer, geen score
❌ "999"    → Willekeurig nummer
```

### Type Field (na "Anders")

```typescript
// VALID TYPES (na "Anders" score)
✅ "Positief"  → Goede bevinding
✅ "Opmerking" → Algemene opmerking

// INVALID
❌ "Anders" zelf telt niet als type
```

## 🔧 Edge Cases

### Case 1: Code Nummer vs Score

```javascript
["...", "5535", "...", "5", ...]
//      ^^^^^^         ^^^
//      Code [3]     Score [5]
```

**Oplossing:** Exacte match op posities [4], [5], [6] met IN ('1','5','10','20')

### Case 2: Anders zonder Type

```javascript
["...", "Anders", null, ...]
```

**Gedrag:**

- Telt niet mee in audit_score ✅
- Telt niet mee in positives ✅
- Telt niet mee in remarks ✅

### Case 3: Positief op Verschillende Posities

```javascript
// DJZ: Positief op [5]
["Cat", "Asp", "Prob", null, "Anders", "Positief", ...]

// RET Oud: Positief op [6]
["Loc", "Sys", "Comp", "Code", "Omschrijving", "Anders", "Positief", ...]

// RET Nieuw: Positief op [7]
["OP HET DAK", "Sys", "Comp", "5535", "Omschrijving", "Waar", "Anders", "Positief", ...]
```

**Oplossing:** Zoek in meerdere posities [4], [5], [6], [7]

## 📊 Statistieken (RET Data)

### Score Verdeling

| Score  | Aantal | Percentage | Type                     |
| ------ | ------ | ---------- | ------------------------ |
| 1      | 539    | 18.6%      | Licht                    |
| 5      | 1463   | 50.6%      | Matig (meest voorkomend) |
| 10     | 532    | 18.4%      | Ernstig                  |
| 20     | 117    | 4.0%       | Zeer ernstig (kritiek)   |
| Anders | 241    | 8.3%       | Positief/Opmerking       |

### Totaal: 2892 waarnemingen

**Insights:**

- 50.6% van waarnemingen zijn "Matig" (score 5)
- 4% zijn kritieke bevindingen (score 20)
- 8.3% zijn positief of opmerkingen

## 🚀 Implementation Notes

### Multi-Client Support

Alle tools ondersteunen verschillende JSON structuren via:

- Flexible positie detectie ([4], [5], [6], [7])
- Client-specific field mapping (CLIENT_FIELD_HINTS)
- Strict validation (alleen valide PQI scores)

### Performance

- Gebruikt JSON_TABLE voor array processing
- CASE statements voor flexible score extraction
- Indexed WHERE clauses (client_id, project_form_id)
- LIMIT clauses op alle queries

### Data Quality

- Strict score validation voorkomt fouten
- Flexible positie detectie handelt alle structuren
- Aparte tracking van scores, positives, remarks

---

**Last Updated:** 17 Oktober 2025  
**Version:** 2.0 - Strict score validation + positives/remarks tracking
