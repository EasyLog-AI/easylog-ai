/**
 * TypeScript types for PQI audit tool results
 */

export interface AuditSubmission {
  audit_number: string;
  audit_date: string;
  business_unit: string;
  material_type: string;
  auditor: string;
  submitted: string;
  observations: number;
  audit_score: number;
  positives: number;
}

export interface AuditTrend {
  period: string;
  total_audits: number;
  avg_audit_score: number;
  total_audit_score: number;
  avg_observations: number;
}

export interface ObservationAnalysis {
  category: string;
  aspect: string;
  score: string;
  frequency: number;
  material_type?: string;
}

export interface VehicleRanking {
  material_type: string;
  business_unit: string;
  total_audits: number;
  avg_score: number;
  total_score: number;
  avg_observations: number;
}
