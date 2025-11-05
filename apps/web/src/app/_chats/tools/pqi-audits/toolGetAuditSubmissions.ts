import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, tool } from 'ai';
import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

import easylogDb from '@/lib/easylog/db';
import tryCatch from '@/utils/try-catch';

import { getAuditSubmissionsConfig } from './config';
import { CLIENT_FIELD_HINTS, DEFAULT_FIELD_NAMES } from './constants';
import type { AuditSubmission } from './types';

const toolGetAuditSubmissions = (
  messageStreamWriter?: UIMessageStreamWriter
) => {
  return tool({
    ...getAuditSubmissionsConfig,
    execute: async (params) => {
      const id = uuidv4();

      messageStreamWriter?.write({
        type: 'data-executing-tool',
        id,
        data: {
          status: 'in_progress',
          message: 'PQI-auditinzendingen ophalen...'
        }
      });

      try {
        // Get field names for this client (fallback to defaults)
        const hints = CLIENT_FIELD_HINTS[params.clientId];
        const auditNumberField =
          hints?.auditNumber || DEFAULT_FIELD_NAMES.auditNumber;
        const dateField = hints?.date || DEFAULT_FIELD_NAMES.date;
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

        if (params.hasSafetyRisks) {
          conditions.push(
            sql`JSON_EXTRACT(s.data, '$.waarnemingen') LIKE '%\"20\"%'`
          );
        }

        // Combine all conditions with AND
        const whereClause =
          conditions.length > 1
            ? sql.join(conditions, sql` AND `)
            : conditions[0];

        // Use default limit if null
        const limit = params.limit ?? 20;

        // Build SELECT with dynamic fields
        const auditNumberPath = sql.raw(`'$.${auditNumberField}'`);
        const datePath = sql.raw(`'$.${dateField}'`);
        const observationsPath = sql.raw(`'$.${observationsField}'`);
        const categoryPath = sql.raw(`'$.${categoryField}'`);
        const subcategoryPath = sql.raw(`'$.${subcategoryField}'`);

        // Execute query
        const [result, error] = await tryCatch(
          easylogDb.execute<AuditSubmission>(sql`
            SELECT
              JSON_UNQUOTE(JSON_EXTRACT(s.data, ${auditNumberPath})) as audit_number,
              JSON_UNQUOTE(JSON_EXTRACT(s.data, ${datePath})) as audit_date,
              JSON_UNQUOTE(JSON_EXTRACT(s.data, ${categoryPath})) as category,
              JSON_UNQUOTE(JSON_EXTRACT(s.data, ${subcategoryPath})) as subcategory,
              u.name as auditor,
              DATE(s.created_at) as submitted,
              JSON_LENGTH(JSON_EXTRACT(s.data, ${observationsPath})) as observations,

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
              ) as audit_score,

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
              ) as positives,

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
              ) as remarks

            FROM submissions s
            LEFT JOIN users u ON s.issuer_id = u.id
            WHERE ${whereClause}
            ORDER BY s.created_at DESC
            LIMIT ${limit}
          `)
        );

        if (error) {
          console.error('Error in getAuditSubmissions:', error);
          Sentry.captureException(error);
          messageStreamWriter?.write({
            type: 'data-executing-tool',
            id,
            data: {
              status: 'error',
              message: `Fout bij ophalen van PQI-auditinzendingen: ${error.message}`
            }
          });
          return `Error retrieving audit submissions: ${error.message}`;
        }

        // Drizzle execute returns [data, metadata] tuple - we only want the data
        const data =
          Array.isArray(result) && result.length > 0 ? result[0] : result;

        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'completed',
            message: 'PQI-auditinzendingen opgehaald'
          }
        });
        return JSON.stringify(data, null, 2);
      } catch (error) {
        console.error('Unexpected error in getAuditSubmissions:', error);
        Sentry.captureException(error);
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        messageStreamWriter?.write({
          type: 'data-executing-tool',
          id,
          data: {
            status: 'completed',
            message: `Fout bij ophalen van PQI-auditinzendingen: ${message}`
          }
        });
        return `Unexpected error: ${message}`;
      }
    }
  });
};

export default toolGetAuditSubmissions;
