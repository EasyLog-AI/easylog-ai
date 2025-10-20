import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';
import { sql } from 'drizzle-orm';

import easylogDb from '@/lib/easylog/db';
import tryCatch from '@/utils/try-catch';

import { getObservationsAnalysisConfig } from './config';
import { CLIENT_FIELD_HINTS, DEFAULT_FIELD_NAMES } from './constants';
import type { ObservationAnalysis } from './types';

const toolGetObservationsAnalysis = () => {
  return tool({
    ...getObservationsAnalysisConfig,
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

        // Add score filter condition - valid PQI scores only: 1, 5, 10, 20
        if (params.minScore != null) {
          conditions.push(
            sql`(
              (JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[4]')) IN ('1', '5', '10', '20')
                AND CAST(JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[4]')) AS UNSIGNED) >= ${params.minScore})
              OR (JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[5]')) IN ('1', '5', '10', '20')
                AND CAST(JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[5]')) AS UNSIGNED) >= ${params.minScore})
              OR (JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[6]')) IN ('1', '5', '10', '20')
                AND CAST(JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[6]')) AS UNSIGNED) >= ${params.minScore})
            )`
          );
        } else {
          // Default: only valid PQI scores (1, 5, 10, 20) from any position
          conditions.push(
            sql`(
              JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[4]')) IN ('1', '5', '10', '20')
              OR JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[5]')) IN ('1', '5', '10', '20')
              OR JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[6]')) IN ('1', '5', '10', '20')
            )`
          );
        }

        const whereClause =
          conditions.length > 1
            ? sql.join(conditions, sql` AND `)
            : conditions[0];

        // Use default limit if null
        const limit = params.limit ?? 20;

        // Build SELECT with dynamic fields
        const observationsPath = sql.raw(`'$.${observationsField}'`);
        const categoryPath = sql.raw(`'$.${categoryField}'`);

        // Execute query
        const [result, error] = await tryCatch(
          easylogDb.execute<ObservationAnalysis>(sql`
            SELECT
              JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[0]')) as observation_category,
              JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[1]')) as aspect,
              CASE
                -- Try position [4] first (DJZ structure) - valid PQI scores: 1, 5, 10, 20
                WHEN JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[4]')) IN ('1', '5', '10', '20')
                THEN JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[4]'))
                -- Try position [5] (old RET structure) - valid PQI scores: 1, 5, 10, 20
                WHEN JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[5]')) IN ('1', '5', '10', '20')
                THEN JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[5]'))
                -- Try position [6] (new RET structure) - valid PQI scores: 1, 5, 10, 20
                WHEN JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[6]')) IN ('1', '5', '10', '20')
                THEN JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[6]'))
                ELSE NULL
              END as score,
              COUNT(*) as frequency,
              JSON_UNQUOTE(JSON_EXTRACT(s.data, ${categoryPath})) as audit_category
            FROM submissions s,
            JSON_TABLE(
              JSON_EXTRACT(s.data, ${observationsPath}),
              '$[*]' COLUMNS (waarneming JSON PATH '$')
            ) AS obs
            WHERE ${whereClause}
            GROUP BY observation_category, aspect, score, audit_category
            ORDER BY frequency DESC
            LIMIT ${limit}
          `)
        );

        if (error) {
          console.error('Error in getObservationsAnalysis:', error);
          Sentry.captureException(error);
          return `Error analyzing observations: ${error.message}`;
        }

        // Drizzle execute returns [data, metadata] tuple - we only want the data
        const data =
          Array.isArray(result) && result.length > 0 ? result[0] : result;
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
