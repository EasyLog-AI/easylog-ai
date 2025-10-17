import { z } from 'zod';

export const getVehicleRankingConfig = {
  name: 'getVehicleRanking',
  description:
    'Get PQI vehicle/material ranking by average audit score and audit count. Use this to identify which vehicles/products have the most issues.',
  inputSchema: z.object({
    auditType: z
      .enum(['IKZ', 'PQI', 'R&M'])
      .nullable()
      .default(null)
      .describe('Filter by audit type'),
    modality: z
      .enum(['Metro', 'Bus', 'Tram'])
      .nullable()
      .default(null)
      .describe('Filter by transport modality'),
    year: z.number().nullable().default(null).describe('Filter by specific year'),
    limit: z
      .number()
      .nullable()
      .default(10)
      .describe('Maximum number of results')
  })
} as const;

export const getObservationsAnalysisConfig = {
  name: 'getObservationsAnalysis',
  description:
    'Analyze PQI audit observations to find most common problems, grouped by category, aspect, and score. Use this to identify recurring issues.',
  inputSchema: z.object({
    auditType: z
      .enum(['IKZ', 'PQI', 'R&M'])
      .nullable()
      .default(null)
      .describe('Filter by audit type'),
    modality: z
      .enum(['Metro', 'Bus', 'Tram'])
      .nullable()
      .default(null)
      .describe('Filter by transport modality'),
    vehicleNumber: z
      .string()
      .nullable()
      .default(null)
      .describe('Filter by vehicle number (e.g., "5633" - matches audit_number prefix)'),
    materialType: z
      .string()
      .nullable()
      .default(null)
      .describe('Filter by material type (e.g., "RSG3", "MG2/1")'),
    year: z.number().nullable().default(null).describe('Filter by specific year'),
    minScore: z
      .number()
      .nullable()
      .default(null)
      .describe('Minimum score to include (e.g., 5 for non-trivial issues)'),
    limit: z
      .number()
      .nullable()
      .default(20)
      .describe('Maximum number of results')
  })
} as const;

export const getAuditTrendsConfig = {
  name: 'getAuditTrends',
  description:
    'Get PQI audit trends over time (monthly or weekly aggregations). Use this to analyze audit patterns and score trends.',
  inputSchema: z.object({
    auditType: z
      .enum(['IKZ', 'PQI', 'R&M'])
      .nullable()
      .default(null)
      .describe('Filter by audit type'),
    modality: z
      .enum(['Metro', 'Bus', 'Tram'])
      .nullable()
      .default(null)
      .describe('Filter by transport modality'),
    vehicleNumber: z
      .string()
      .nullable()
      .default(null)
      .describe('Filter by vehicle number (e.g., "5633" - matches audit_number prefix)'),
    materialType: z
      .string()
      .nullable()
      .default(null)
      .describe('Filter by material type (e.g., "RSG3", "MG2/1")'),
    year: z.number().nullable().default(null).describe('Filter by specific year'),
    groupBy: z
      .enum(['month', 'week'])
      .nullable()
      .default('month')
      .describe('Group results by month or week')
  })
} as const;

export const getAuditSubmissionsConfig = {
  name: 'getAuditSubmissions',
  description:
    'Get PQI audit submissions with calculated scores. Use this to retrieve audit data filtered by type, modality, vehicle, or date range.',
  inputSchema: z.object({
    auditType: z
      .enum(['IKZ', 'PQI', 'R&M'])
      .nullable()
      .default(null)
      .describe('Filter by audit type'),
    modality: z
      .enum(['Metro', 'Bus', 'Tram'])
      .nullable()
      .default(null)
      .describe('Filter by transport modality'),
    vehicleNumber: z
      .string()
      .nullable()
      .default(null)
      .describe('Filter by vehicle number (e.g., "5633" - matches audit_number prefix)'),
    materialType: z
      .string()
      .nullable()
      .default(null)
      .describe('Filter by material type (e.g., "RSG3", "MG2/1")'),
    year: z.number().nullable().default(null).describe('Filter by specific year'),
    hasSafetyRisks: z
      .boolean()
      .nullable()
      .default(null)
      .describe('Only show audits with safety risks (20pt observations)'),
    limit: z
      .number()
      .nullable()
      .default(20)
      .describe('Maximum number of results')
  })
} as const;
