/**
 * TypeScript types for PQI audit tool results Supports multi-client with
 * flexible field names
 */

export interface AuditSubmission {
  audit_number: string;
  audit_date: string;
  category: string; // RET: material_type (RSG3, etc), DJZ: project name
  subcategory: string; // RET: business_unit (Waalhaven), DJZ: contract number
  auditor: string;
  submitted: string;
  observations: number;
  audit_score: number; // Sum of numeric scores (1, 5, 10, 20 only)
  positives: number; // Count of "Positief" observations (when score="Anders" + "Positief")
  remarks: number; // Count of "Opmerking" observations (when score="Anders" + "Opmerking")
}

export interface AuditTrend {
  period: string;
  total_audits: number;
  avg_audit_score: number;
  total_audit_score: number;
  avg_observations: number;
}

export interface ObservationAnalysis {
  observation_category: string; // Category within the observation (not the audit category)
  aspect: string;
  score: string;
  frequency: number;
  audit_category?: string; // RET: material_type, DJZ: project name
}

export interface VehicleRanking {
  category: string; // RET: material_type, DJZ: project name
  subcategory: string; // RET: business_unit, DJZ: contract number
  total_audits: number;
  avg_score: number; // Average of numeric scores (1, 5, 10, 20)
  total_score: number; // Sum of all numeric scores (1, 5, 10, 20)
  avg_observations: number;
  total_positives: number; // Total count of "Positief" observations
  total_remarks: number; // Total count of "Opmerking" observations
}
