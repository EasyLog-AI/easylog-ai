/**
 * PQI Audit Constants (Product Quality Index) Fully generic multi-client
 * support Supports completely different JSON structures per client
 */

/**
 * Default JSON field names These are common field names that work for most
 * clients Tools will try these fields if no client-specific hints exist
 */
export const DEFAULT_FIELD_NAMES = {
  auditNumber: 'auditnummer', // Audit identifier (can be: projectnummer, inspectienummer, etc.)
  date: 'datum', // Audit date
  observations: 'waarnemingen', // Observations array
  category: 'typematerieel', // Primary category (can be: projectnaam, type, etc.)
  subcategory: 'bu' // Secondary category (can be: locatie, kenmerk, etc.)
} as const;

/**
 * Optional client-specific field hints Add entries here if a client uses
 * different field names Any field not specified will fall back to
 * DEFAULT_FIELD_NAMES
 *
 * Examples of field variations:
 *
 * - AuditNumber: "auditnummer", "projectnummer", "inspectienummer",
 *   "keuringnummer"
 * - Date: "datum", "inspectiedatum", "keuringsdatum"
 * - Observations: "waarnemingen", "bevindingen", "findings"
 * - Category: "typematerieel", "projectnaam", "betreft", "type"
 * - Subcategory: "bu", "locatie", "kenmerk", "contract"
 */
export const CLIENT_FIELD_HINTS: Record<
  number,
  {
    name?: string;
    auditNumber?: string;
    date?: string;
    observations?: string;
    category?: string;
    subcategory?: string;
  }
> = {
  // RET (16) - Uses all default fields
  16: {
    name: 'RET'
    // auditNumber: 'auditnummer' (default)
    // date: 'datum' (default)
    // observations: 'waarnemingen' (default)
    // category: 'typematerieel' (default)
    // subcategory: 'bu' (default)
  },
  // DJZ (21) - Uses different category fields
  21: {
    name: 'DJZ',
    category: 'betreft', // Project name instead of typematerieel
    subcategory: 'kenmerk' // Contract instead of bu
    // auditNumber: 'auditnummer' (default)
    // date: 'datum' (default)
    // observations: 'waarnemingen' (default)
  }
  // Future clients: Add entries ONLY for fields that differ from defaults
  // Example with ALL fields different:
  // 99: {
  //   name: 'CustomClient',
  //   auditNumber: 'projectnummer',
  //   date: 'inspectiedatum',
  //   observations: 'bevindingen',
  //   category: 'projecttype',
  //   subcategory: 'locatie'
  // }
};
