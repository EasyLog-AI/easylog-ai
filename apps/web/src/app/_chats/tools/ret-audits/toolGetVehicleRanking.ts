import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';
import { sql } from 'drizzle-orm';

import easylogDb from '@/lib/easylog/db';
import tryCatch from '@/utils/try-catch';

import { getVehicleRankingConfig } from './config';
import { AUDIT_TYPE_FILTERS, CLIENT_ID, MODALITY_FILTERS } from './constants';
import type { VehicleRanking } from './types';

const toolGetVehicleRanking = () => {
  return tool({
    ...getVehicleRankingConfig,
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

        if (params.year) {
          conditions.push(sql`YEAR(s.created_at) = ${params.year}`);
        }

        const whereClause =
          conditions.length > 1
            ? sql.join(conditions, sql` AND `)
            : conditions[0];

        // Execute query
        const [result, error] = await tryCatch(
          easylogDb.execute<VehicleRanking>(sql`
            SELECT
              JSON_UNQUOTE(JSON_EXTRACT(s.data, '$.typematerieel')) as material_type,
              JSON_UNQUOTE(JSON_EXTRACT(s.data, '$.bu')) as business_unit,
              COUNT(*) as total_audits,
              ROUND(AVG(
                COALESCE(
                  (SELECT SUM(
                    CASE
                      WHEN JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[5]')) REGEXP '^[0-9]+$'
                      THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[5]')) AS UNSIGNED)
                      ELSE 0
                    END
                  )
                  FROM JSON_TABLE(
                    JSON_EXTRACT(s.data, '$.waarnemingen'),
                    '$[*]' COLUMNS (waarneming JSON PATH '$')
                  ) AS obs), 0
                )
              ), 1) as avg_score,
              SUM(
                COALESCE(
                  (SELECT SUM(
                    CASE
                      WHEN JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[5]')) REGEXP '^[0-9]+$'
                      THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[5]')) AS UNSIGNED)
                      ELSE 0
                    END
                  )
                  FROM JSON_TABLE(
                    JSON_EXTRACT(s.data, '$.waarnemingen'),
                    '$[*]' COLUMNS (waarneming JSON PATH '$')
                  ) AS obs), 0
                )
              ) as total_score,
              AVG(JSON_LENGTH(JSON_EXTRACT(s.data, '$.waarnemingen'))) as avg_observations

            FROM submissions s
            WHERE ${whereClause}
            GROUP BY material_type, business_unit
            ORDER BY avg_score DESC
            LIMIT ${params.limit}
          `)
        );

        if (error) {
          console.error('Error in getVehicleRanking:', error);
          Sentry.captureException(error);
          return `Error retrieving vehicle ranking: ${error.message}`;
        }

        // Drizzle execute returns [data, metadata] tuple - we only want the data
        const data = Array.isArray(result) && result.length > 0 ? result[0] : result;
        return JSON.stringify(data, null, 2);
      } catch (error) {
        console.error('Unexpected error in getVehicleRanking:', error);
        Sentry.captureException(error);
        return `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }
  });
};

export default toolGetVehicleRanking;
