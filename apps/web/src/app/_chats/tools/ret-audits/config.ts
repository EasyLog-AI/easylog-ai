import { z } from 'zod';

export const getVehicleRankingConfig = {
  name: 'getVehicleRanking',
  description:
    'Get RET vehicle/material ranking by average audit score and audit count. Use this to identify which vehicles have the most issues.',
  inputSchema: z.object({
    auditType: z
      .enum(['IKZ', 'PQI', 'R&M'])
      .nullable()
      .describe('Filter by audit type'),
    modality: z
      .enum(['Metro', 'Bus', 'Tram'])
      .nullable()
      .describe('Filter by transport modality'),
    year: z.number().nullable().describe('Filter by specific year'),
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
    'Analyze RET audit observations to find most common problems, grouped by category, aspect, and score. Use this to identify recurring issues.',
  inputSchema: z.object({
    auditType: z
      .enum(['IKZ', 'PQI', 'R&M'])
      .nullable()
      .describe('Filter by audit type'),
    modality: z
      .enum(['Metro', 'Bus', 'Tram'])
      .nullable()
      .describe('Filter by transport modality'),
    vehicleNumber: z
      .string()
      .nullable()
      .describe('Filter by specific vehicle/material number'),
    year: z.number().nullable().describe('Filter by specific year'),
    minScore: z
      .number()
      .nullable()
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
    'Get RET audit trends over time (monthly or weekly aggregations). Use this to analyze audit patterns and score trends.',
  inputSchema: z.object({
    auditType: z
      .enum(['IKZ', 'PQI', 'R&M'])
      .nullable()
      .describe('Filter by audit type'),
    modality: z
      .enum(['Metro', 'Bus', 'Tram'])
      .nullable()
      .describe('Filter by transport modality'),
    vehicleNumber: z
      .string()
      .nullable()
      .describe('Filter by specific vehicle/material number'),
    year: z.number().nullable().describe('Filter by specific year'),
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
    'Get RET audit submissions with calculated scores. Use this to retrieve audit data filtered by type, modality, vehicle, or date range.',
  inputSchema: z.object({
    auditType: z
      .enum(['IKZ', 'PQI', 'R&M'])
      .nullable()
      .describe('Filter by audit type'),
    modality: z
      .enum(['Metro', 'Bus', 'Tram'])
      .nullable()
      .describe('Filter by transport modality'),
    vehicleNumber: z
      .string()
      .nullable()
      .describe('Filter by specific vehicle/material number'),
    year: z.number().nullable().describe('Filter by specific year'),
    hasSafetyRisks: z
      .boolean()
      .nullable()
      .describe('Only show audits with safety risks (20pt observations)'),
    limit: z
      .number()
      .nullable()
      .default(20)
      .describe('Maximum number of results')
  })
} as const;
