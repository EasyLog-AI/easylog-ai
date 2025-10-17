import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';
import { sql } from 'drizzle-orm';

import easylogDb from '@/lib/easylog/db';
import tryCatch from '@/utils/try-catch';

import { getAuditTrendsConfig } from './config';
import { CLIENT_FIELD_HINTS, DEFAULT_FIELD_NAMES } from './constants';
import type { AuditTrend } from './types';

const toolGetAuditTrends = () => {
  return tool({
    ...getAuditTrendsConfig,
    execute: async (params) => {
      try {
        // Get field names for this client (fallback to defaults)
        const hints = CLIENT_FIELD_HINTS[params.clientId];
        const auditNumberField =
          hints?.auditNumber || DEFAULT_FIELD_NAMES.auditNumber;
        const observationsField =
          hints?.observations || DEFAULT_FIELD_NAMES.observations;
        const categoryField = hints?.category || DEFAULT_FIELD_NAMES.category;

        // Build dynamic WHERE clause
        const conditions = [
          sql`s.client_id = ${params.clientId}`,
          sql`s.data IS NOT NULL`
        ];

        // Filter by form IDs if provided
        if (params.formIds && params.formIds.length > 0) {
          conditions.push(
            sql`s.project_form_id IN (${sql.join(
              params.formIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          );
        }

        // Filter by audit number prefix (flexible field)
        if (params.auditNumber) {
          const auditPath = sql.raw(`'$.${auditNumberField}'`);
          conditions.push(
            sql`JSON_UNQUOTE(JSON_EXTRACT(s.data, ${auditPath})) LIKE ${`${params.auditNumber}%`}`
          );
        }

        // Filter by category (flexible field)
        if (params.category) {
          const catPath = sql.raw(`'$.${categoryField}'`);
          conditions.push(
            sql`JSON_UNQUOTE(JSON_EXTRACT(s.data, ${catPath})) = ${params.category}`
          );
        }

        if (params.year) {
          conditions.push(sql`YEAR(s.created_at) = ${params.year}`);
        }

        const whereClause =
          conditions.length > 1
            ? sql.join(conditions, sql` AND `)
            : conditions[0];

        // Date format based on groupBy
        const dateFormat = params.groupBy === 'week' ? '%Y-%u' : '%Y-%m';

        // Build SELECT with dynamic observations field
        const observationsPath = sql.raw(`'$.${observationsField}'`);

        // Execute query
        const [result, error] = await tryCatch(
          easylogDb.execute<AuditTrend>(sql`
            SELECT
              DATE_FORMAT(s.created_at, ${dateFormat}) as period,
              COUNT(*) as total_audits,
              ROUND(AVG(
                COALESCE(
                  (SELECT SUM(
                    CASE
                      -- Try position [4] first (DJZ structure) - valid PQI scores: 1, 5, 10, 20
                      WHEN JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[4]')) IN ('1', '5', '10', '20')
                      THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[4]')) AS UNSIGNED)
                      -- Try position [5] (old RET structure) - valid PQI scores: 1, 5, 10, 20
                      WHEN JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[5]')) IN ('1', '5', '10', '20')
                      THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[5]')) AS UNSIGNED)
                      -- Try position [6] (new RET structure) - valid PQI scores: 1, 5, 10, 20
                      WHEN JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[6]')) IN ('1', '5', '10', '20')
                      THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[6]')) AS UNSIGNED)
                      ELSE 0
                    END
                  )
                  FROM JSON_TABLE(
                    JSON_EXTRACT(s.data, ${observationsPath}),
                    '$[*]' COLUMNS (waarneming JSON PATH '$')
                  ) AS obs), 0
                )
              ), 1) as avg_audit_score,
              SUM(
                COALESCE(
                  (SELECT SUM(
                    CASE
                      -- Try position [4] first (DJZ structure) - valid PQI scores: 1, 5, 10, 20
                      WHEN JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[4]')) IN ('1', '5', '10', '20')
                      THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[4]')) AS UNSIGNED)
                      -- Try position [5] (old RET structure) - valid PQI scores: 1, 5, 10, 20
                      WHEN JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[5]')) IN ('1', '5', '10', '20')
                      THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[5]')) AS UNSIGNED)
                      -- Try position [6] (new RET structure) - valid PQI scores: 1, 5, 10, 20
                      WHEN JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[6]')) IN ('1', '5', '10', '20')
                      THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[6]')) AS UNSIGNED)
                      ELSE 0
                    END
                  )
                  FROM JSON_TABLE(
                    JSON_EXTRACT(s.data, ${observationsPath}),
                    '$[*]' COLUMNS (waarneming JSON PATH '$')
                  ) AS obs), 0
                )
              ) as total_audit_score,
              AVG(JSON_LENGTH(JSON_EXTRACT(s.data, ${observationsPath}))) as avg_observations

            FROM submissions s
            WHERE ${whereClause}
            GROUP BY DATE_FORMAT(s.created_at, ${dateFormat})
            ORDER BY period DESC
          `)
        );

        if (error) {
          console.error('Error in getAuditTrends:', error);
          Sentry.captureException(error);
          return `Error retrieving audit trends: ${error.message}`;
        }

        // Drizzle execute returns [data, metadata] tuple - we only want the data
        const data =
          Array.isArray(result) && result.length > 0 ? result[0] : result;
        return JSON.stringify(data, null, 2);
      } catch (error) {
        console.error('Unexpected error in getAuditTrends:', error);
        Sentry.captureException(error);
        return `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }
  });
};

export default toolGetAuditTrends;
