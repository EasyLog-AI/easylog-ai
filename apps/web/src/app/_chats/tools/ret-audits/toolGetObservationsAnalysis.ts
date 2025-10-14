import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';
import { sql } from 'drizzle-orm';

import easylogDb from '@/lib/easylog/db';
import tryCatch from '@/utils/try-catch';

import { getObservationsAnalysisConfig } from './config';
import { AUDIT_TYPE_FILTERS, CLIENT_ID, MODALITY_FILTERS } from './constants';
import type { ObservationAnalysis } from './types';

const toolGetObservationsAnalysis = () => {
  return tool({
    ...getObservationsAnalysisConfig,
    execute: async (params) => {
      try {
        // Build form ID filters
        let finalFormIds: number[] = [];

        if (params.auditType && params.modality) {
          // If both filters specified, get intersection
          const auditIds = new Set<number>(
            AUDIT_TYPE_FILTERS[params.auditType]
          );
          const modalityIds = new Set<number>(
            MODALITY_FILTERS[params.modality]
          );
          finalFormIds = Array.from(auditIds).filter((id) =>
            modalityIds.has(id)
          );
        } else if (params.auditType) {
          finalFormIds = [...AUDIT_TYPE_FILTERS[params.auditType]];
        } else if (params.modality) {
          finalFormIds = [...MODALITY_FILTERS[params.modality]];
        }

        // Build dynamic WHERE clause
        const conditions = [
          sql`s.client_id = ${CLIENT_ID}`,
          sql`s.data IS NOT NULL`
        ];

        if (finalFormIds.length > 0) {
          conditions.push(
            sql`s.project_form_id IN (${sql.join(
              finalFormIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          );
        }

        if (params.vehicleNumber) {
          conditions.push(
            sql`JSON_UNQUOTE(JSON_EXTRACT(s.data, '$.typematerieel')) = ${params.vehicleNumber}`
          );
        }

        if (params.year) {
          conditions.push(sql`YEAR(s.created_at) = ${params.year}`);
        }

        // Add score filter condition
        if (params.minScore !== undefined) {
          conditions.push(
            sql`CAST(JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[5]')) AS UNSIGNED) >= ${params.minScore}`
          );
        } else {
          // Default: only numeric scores
          conditions.push(
            sql`JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[5]')) REGEXP '^[0-9]+$'`
          );
        }

        const whereClause =
          conditions.length > 1
            ? sql.join(conditions, sql` AND `)
            : conditions[0];

        // Execute query
        const [result, error] = await tryCatch(
          easylogDb.execute<ObservationAnalysis>(sql`
            SELECT
              JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[0]')) as category,
              JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[1]')) as aspect,
              JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[5]')) as score,
              COUNT(*) as frequency,
              JSON_UNQUOTE(JSON_EXTRACT(s.data, '$.typematerieel')) as material_type
            FROM submissions s,
            JSON_TABLE(
              JSON_EXTRACT(s.data, '$.waarnemingen'),
              '$[*]' COLUMNS (waarneming JSON PATH '$')
            ) AS obs
            WHERE ${whereClause}
            GROUP BY category, aspect, score, material_type
            ORDER BY frequency DESC
            LIMIT ${params.limit}
          `)
        );

        if (error) {
          console.error('Error in getObservationsAnalysis:', error);
          Sentry.captureException(error);
          return `Error analyzing observations: ${error.message}`;
        }

        // Drizzle execute returns [data, metadata] tuple - we only want the data
        const data = Array.isArray(result) && result.length > 0 ? result[0] : result;
        return JSON.stringify(data, null, 2);
      } catch (error) {
        console.error('Unexpected error in getObservationsAnalysis:', error);
        Sentry.captureException(error);
        return `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }
  });
};

export default toolGetObservationsAnalysis;
