import * as Sentry from '@sentry/nextjs';
import { tool } from 'ai';
import { sql } from 'drizzle-orm';

import easylogDb from '@/lib/easylog/db';
import tryCatch from '@/utils/try-catch';

import { getVehicleRankingConfig } from './config';
import { CLIENT_FIELD_HINTS, DEFAULT_FIELD_NAMES } from './constants';
import type { VehicleRanking } from './types';

const toolGetVehicleRanking = () => {
  return tool({
    ...getVehicleRankingConfig,
    execute: async (params) => {
      try {
        // Get field names for this client (fallback to defaults)
        const hints = CLIENT_FIELD_HINTS[params.clientId];
        const observationsField =
          hints?.observations || DEFAULT_FIELD_NAMES.observations;
        const categoryField = hints?.category || DEFAULT_FIELD_NAMES.category;
        const subcategoryField =
          hints?.subcategory || DEFAULT_FIELD_NAMES.subcategory;

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

        if (params.year) {
          conditions.push(sql`YEAR(s.created_at) = ${params.year}`);
        }

        const whereClause =
          conditions.length > 1
            ? sql.join(conditions, sql` AND `)
            : conditions[0];

        // Use default limit if null
        const limit = params.limit ?? 10;

        // Build SELECT with dynamic fields
        const observationsPath = sql.raw(`'$.${observationsField}'`);
        const categoryPath = sql.raw(`'$.${categoryField}'`);
        const subcategoryPath = sql.raw(`'$.${subcategoryField}'`);

        // Execute query
        const [result, error] = await tryCatch(
          easylogDb.execute<VehicleRanking>(sql`
            SELECT
              JSON_UNQUOTE(JSON_EXTRACT(s.data, ${categoryPath})) as category,
              JSON_UNQUOTE(JSON_EXTRACT(s.data, ${subcategoryPath})) as subcategory,
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
              ), 1) as avg_score,
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
              ) as total_score,
              AVG(JSON_LENGTH(JSON_EXTRACT(s.data, ${observationsPath}))) as avg_observations,
              
              SUM(
                COALESCE(
                  (SELECT COUNT(*)
                  FROM JSON_TABLE(
                    JSON_EXTRACT(s.data, ${observationsPath}),
                    '$[*]' COLUMNS (waarneming JSON PATH '$')
                  ) AS obs
                  WHERE (JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[4]')) = 'Anders' 
                          AND JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[5]')) = 'Positief')
                     OR (JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[5]')) = 'Anders' 
                          AND JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[6]')) = 'Positief')
                     OR (JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[6]')) = 'Anders' 
                          AND JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[7]')) = 'Positief')), 0
                )
              ) as total_positives,
              
              SUM(
                COALESCE(
                  (SELECT COUNT(*)
                  FROM JSON_TABLE(
                    JSON_EXTRACT(s.data, ${observationsPath}),
                    '$[*]' COLUMNS (waarneming JSON PATH '$')
                  ) AS obs
                  WHERE (JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[4]')) = 'Anders' 
                          AND JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[5]')) = 'Opmerking')
                     OR (JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[5]')) = 'Anders' 
                          AND JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[6]')) = 'Opmerking')
                     OR (JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[6]')) = 'Anders' 
                          AND JSON_UNQUOTE(JSON_EXTRACT(waarneming, '$[7]')) = 'Opmerking')), 0
                )
              ) as total_remarks

            FROM submissions s
            WHERE ${whereClause}
            GROUP BY category, subcategory
            ORDER BY avg_score DESC
            LIMIT ${limit}
          `)
        );

        if (error) {
          console.error('Error in getVehicleRanking:', error);
          Sentry.captureException(error);
          return `Error retrieving vehicle ranking: ${error.message}`;
        }

        // Drizzle execute returns [data, metadata] tuple - we only want the data
        const data =
          Array.isArray(result) && result.length > 0 ? result[0] : result;
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
