import { z } from 'zod';

export const getVehicleRankingConfig = {
  name: 'getVehicleRanking',
  description:
    'Get PQI vehicle/material ranking by average audit score and audit count. Multi-client support.',
  inputSchema: z.object({
    clientId: z
      .number()
      .default(16)
      .describe('Client ID: 16 = RET, 21 = DJZ, etc.'),
    formIds: z
      .array(z.number())
      .nullable()
      .default(null)
      .describe(
        'Filter by specific form IDs (optional - query database to find available forms)'
      ),
    year: z
      .number()
      .nullable()
      .default(null)
      .describe('Filter by specific year'),
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
    'Analyze PQI audit observations to find most common problems. Multi-client support.',
  inputSchema: z.object({
    clientId: z
      .number()
      .default(16)
      .describe('Client ID: 16 = RET, 21 = DJZ, etc.'),
    formIds: z
      .array(z.number())
      .nullable()
      .default(null)
      .describe(
        'Filter by specific form IDs (optional - query database to find available forms)'
      ),
    auditNumber: z
      .string()
      .nullable()
      .default(null)
      .describe('Filter by audit number prefix (e.g., "5633")'),
    category: z
      .string()
      .nullable()
      .default(null)
      .describe('Filter by category field from data JSON (varies per client)'),
    year: z
      .number()
      .nullable()
      .default(null)
      .describe('Filter by specific year'),
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
    'Get PQI audit trends over time (monthly or weekly). Multi-client support.',
  inputSchema: z.object({
    clientId: z
      .number()
      .default(16)
      .describe('Client ID: 16 = RET, 21 = DJZ, etc.'),
    formIds: z
      .array(z.number())
      .nullable()
      .default(null)
      .describe(
        'Filter by specific form IDs (optional - query database to find available forms)'
      ),
    auditNumber: z
      .string()
      .nullable()
      .default(null)
      .describe('Filter by audit number prefix (e.g., "5633")'),
    category: z
      .string()
      .nullable()
      .default(null)
      .describe('Filter by category field from data JSON (varies per client)'),
    year: z
      .number()
      .nullable()
      .default(null)
      .describe('Filter by specific year'),
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
    'Get PQI audit submissions with calculated scores. Multi-client support.',
  inputSchema: z.object({
    clientId: z
      .number()
      .default(16)
      .describe('Client ID: 16 = RET, 21 = DJZ, etc.'),
    formIds: z
      .array(z.number())
      .nullable()
      .default(null)
      .describe(
        'Filter by specific form IDs (optional - query database to find available forms)'
      ),
    auditNumber: z
      .string()
      .nullable()
      .default(null)
      .describe('Filter by audit number prefix (e.g., "5633")'),
    category: z
      .string()
      .nullable()
      .default(null)
      .describe('Filter by category field from data JSON (varies per client)'),
    year: z
      .number()
      .nullable()
      .default(null)
      .describe('Filter by specific year'),
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
