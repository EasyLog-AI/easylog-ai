/**
 * RET Rotterdam Audit Constants
 * Form ID mappings for audit types and modalities
 */

export const CLIENT_ID = 16;

/**
 * Audit Type Form ID Mappings
 * Based on RET agent prompt specifications
 */
export const AUDIT_TYPE_FILTERS = {
  IKZ: [145, 134, 137, 139, 136, 141, 131, 130, 132, 135, 129, 142],
  PQI: [122, 125, 140, 127, 144, 126, 123, 128],
  'R&M': [145, 140, 144, 141, 142]
} as const;

/**
 * Modality Form ID Mappings
 * Filters by transport type (Metro, Bus, Tram)
 */
export const MODALITY_FILTERS = {
  Metro: [134, 137, 132, 135, 129, 122, 127],
  Bus: [139, 131, 123, 128],
  Tram: [136, 130, 125, 126]
} as const;

export type AuditType = keyof typeof AUDIT_TYPE_FILTERS;
export type Modality = keyof typeof MODALITY_FILTERS;
