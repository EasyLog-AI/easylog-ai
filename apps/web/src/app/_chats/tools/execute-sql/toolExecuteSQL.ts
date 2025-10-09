import * as Sentry from '@sentry/nextjs';
import { UIMessageStreamWriter, generateText, stepCountIs, tool } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import openrouterProvider from '@/lib/ai-providers/openrouter';
import easylogDb from '@/lib/easylog/db';
import tryCatch from '@/utils/try-catch';

import { executeSQLConfig } from './config';
import truncateStrings from './utils/truncateStrings';

const toolExecuteSQL = (messageStreamWriter?: UIMessageStreamWriter) => {
  return tool({
    ...executeSQLConfig,
    execute: async (query) => {
      const id = uuidv4();

      console.log('Executing SQL query', query.proposedQuery);

      messageStreamWriter?.write({
        type: 'data-research',
        id,
        data: {
          status: 'loading',
          title: 'Executing query',
          body: `${query.queryIntent}`
        }
      });

      const [result, error] = await tryCatch(
        generateText({
          model: openrouterProvider('google/gemini-2.5-flash'),
          prompt: `
You are an expert MariaDB SQL analyst with access to the Easylog database. Your task is to execute queries and provide clear, actionable results.

DATABASE: MariaDB (MySQL-compatible syntax)

CRITICAL RULES:
- ALWAYS limit SELECT queries to 20 rows maximum using LIMIT 20
- PREFER aggregate functions when the user wants summaries, counts, or analysis
- For large datasets, use GROUP BY with aggregate functions instead of raw data
- Support SELECT, UPDATE, DELETE operations as requested
- Provide clear explanations of what the query does and what the results mean
- If the query fails, explain the error and suggest corrections

MARIADB-SPECIFIC SYNTAX:
- Date functions: Use DATE_FORMAT(), YEAR(), MONTH(), DAY() instead of DATE_TRUNC
- JSON queries: Use JSON_EXTRACT(column, '$.path') or column->'$.path' for JSON data
- JSON functions: JSON_VALID(), JSON_CONTAINS(), JSON_KEYS(), JSON_LENGTH()
- String functions: CONCAT(), SUBSTRING(), LOCATE() instead of PostgreSQL equivalents
- Case sensitivity: Table and column names are case-sensitive on Linux systems

JSON QUERY EXAMPLES:
- Extract JSON field: SELECT JSON_EXTRACT(data, '$.name') as name FROM table
- Check JSON contains: SELECT * FROM table WHERE JSON_CONTAINS(data, '"value"', '$.field')
- Get JSON keys: SELECT JSON_KEYS(data) FROM table
- Validate JSON: SELECT * FROM table WHERE JSON_VALID(data)

OUTPUT FORMAT:
Return plain text with:
- Brief explanation of what the query accomplished
- The query results in a clear, readable format
- Error message if the query fails or omit if successful

EXAMPLES:
- "Show me all users" → SELECT * FROM users LIMIT 20
- "How many orders per month?" → SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as order_count FROM orders GROUP BY month ORDER BY month
- "Total sales by product" → SELECT product_name, SUM(amount) as total_sales FROM orders GROUP BY product_name ORDER BY total_sales DESC LIMIT 20
- "Get user preferences from JSON" → SELECT id, JSON_EXTRACT(preferences, '$.theme') as theme FROM users WHERE JSON_VALID(preferences) LIMIT 20

TABLES:

Below is a list of available tables and columns encoded as {table_name|column_name:data_type:is_json,column_name:data_type:is_json,...}

activity_log|id:bigint:0,log_name:varchar:0,description:text:0,subject_type:varchar:0,event:varchar:0,subject_id:bigint:0,causer_type:varchar:0,causer_id:bigint:0,properties:longtext:1,batch_uuid:char:0,created_at:timestamp:0,updated_at:timestamp:0
agents|id:int:0,name:varchar:0,is_active:tinyint:0,created_at:timestamp:0,updated_at:timestamp:0,deleted_at:timestamp:0
announcements|id:bigint:0,announcement_template_id:bigint:0,announcement_template_version_id:bigint:0,announcement_category_id:bigint:0,announcement_attachment_id:bigint:0,client_id:int:0,title:varchar:0,content:text:0,read_receipt:tinyint:0,send_to_all_users:tinyint:0,send_email:tinyint:0,send_push_notification:tinyint:0,sender_id:int:0,created_at:timestamp:0,updated_at:timestamp:0,deleted_at:timestamp:0
announcement_attachments|id:bigint:0,created_at:timestamp:0,updated_at:timestamp:0
announcement_categories|id:bigint:0,client_id:int:0,name:varchar:0,notification_title:varchar:0,default_sender_name:varchar:0,is_system_message:tinyint:0,order:int:0,created_at:timestamp:0,updated_at:timestamp:0
announcement_statuses|id:bigint:0,announcement_user_id:bigint:0,status:varchar:0,media_id:bigint:0,created_at:timestamp:0,updated_at:timestamp:0
announcement_templates|id:bigint:0,client_id:int:0,announcement_category_id:bigint:0,title:varchar:0,content:text:0,send_push_notification:tinyint:0,send_email:tinyint:0,send_to_all_users:tinyint:0,read_receipt:tinyint:0,rrule:varchar:0,sender_id:int:0,scheduled_at:datetime:0,next_scheduled_at:datetime:0,concept:tinyint:0,processing:datetime:0,finished_processing_at:datetime:0,created_at:timestamp:0,updated_at:timestamp:0,deleted_at:timestamp:0
announcement_template_targets|announcement_template_id:bigint:0,targetable_type:varchar:0,targetable_id:bigint:0
announcement_user|id:bigint:0,announcement_id:bigint:0,user_id:int:0,user_group_ids:longtext:1,created_at:timestamp:0,updated_at:timestamp:0
api_instances|id:bigint:0,name:varchar:0,identity_id:int:0,slug:varchar:0,url:varchar:0,tags:longtext:1,hidden:tinyint:0,active:tinyint:0,show_environment:tinyint:0,order:int:0,created_at:timestamp:0,updated_at:timestamp:0,deleted_at:timestamp:0
api_sessions|user_id:int:0,token:varchar:0,invalidates_at:timestamp:0
auth_configurations|id:bigint:0,type:varchar:0,name:varchar:0,client_id:varchar:0,issuer:varchar:0,is_oidc:tinyint:0,endpoints:longtext:1,scopes:longtext:1,meta:longtext:1,jwks:longtext:1,order:int:0,hidden:tinyint:0,hidden_on_web:tinyint:0,active:tinyint:0,sync_roles:tinyint:0,sync_user_groups:tinyint:0,sync_login_allowed:tinyint:0,legacy_sync:tinyint:0,created_at:timestamp:0,updated_at:timestamp:0,deleted_at:timestamp:0
bulletin_categories|id:bigint:0,client_id:int:0,name:varchar:0,slug:varchar:0,order:int:0,created_at:timestamp:0,updated_at:timestamp:0
bulletin_chapters|id:int:0,created_at:timestamp:0,updated_at:timestamp:0,client_id:int:0,category_id:bigint:0,title:varchar:0,slug:varchar:0,icon:varchar:0,order:int:0,parent_id:int:0,contains_announcable_items:tinyint:0,default_announcement_category_id:bigint:0
bulletin_chapter_user_groups|bulletin_chapter_id:int:0,user_group_id:int:0
bulletin_items|id:int:0,client_id:int:0,title:varchar:0,content:text:0,type:enum:0,created_at:timestamp:0,updated_at:timestamp:0,updated_by:int:0,bulletin_chapter_id:int:0,order:int:0
cache|key:varchar:0,value:mediumtext:0,expiration:int:0
cache_locks|key:varchar:0,owner:varchar:0,expiration:int:0
categories|id:int:0,name:varchar:0,description:varchar:0,avatar:varchar:0,agent_id:int:0,created_at:timestamp:0,updated_at:timestamp:0
category_clients|category_id:int:0,client_id:int:0
category_forms|category_id:int:0,form_id:int:0
clients|id:int:0,agent_id:int:0,name:varchar:0,language:varchar:0,department:text:0,salutation:text:0,initials:text:0,firstname:text:0,preposition:text:0,lastname:text:0,email:text:0,phone:text:0,mobile:text:0,invoice_attn:text:0,invoice_address:text:0,invoice_address_number:text:0,invoice_zipcode:text:0,invoice_city:text:0,invoice_country:text:0,invoice_extra:text:0,settings:text:0,configuration:longtext:1,is_active:tinyint:0,created_at:timestamp:0,updated_at:timestamp:0,deleted_at:timestamp:0,reports_config:longtext:0,chatgpt:longtext:1,onesignal_app:varchar:0,locked_at:timestamp:0
client_feature|client_id:int:0,feature_id:int:0
entities|id:bigint:0,name:varchar:0,description:varchar:0,types:longtext:1,scheme:longtext:1,client_id:int:0,locked_import:tinyint:0,created_at:timestamp:0,updated_at:timestamp:0,slug:varchar:0,icon:varchar:0,category_id:bigint:0
entity_allocations|id:bigint:0,project_id:bigint:0,resource_id:bigint:0,parent_id:bigint:0,group:varchar:0,type:varchar:0,comment:varchar:0,data:longtext:1,start:timestamp:0,end:timestamp:0,created_at:timestamp:0,updated_at:timestamp:0
entity_allocation_type_allocations|id:bigint:0,slug:varchar:0,project_id:bigint:0,start:timestamp:0,end:timestamp:0,is_staged:tinyint:0,created_at:timestamp:0,updated_at:timestamp:0
entity_categories|id:bigint:0,name:varchar:0,client_id:int:0,order:int:0,created_at:timestamp:0,updated_at:timestamp:0
entity_data|id:bigint:0,entity_id:bigint:0,data:longtext:1,token:varchar:0,created_at:timestamp:0,updated_at:timestamp:0,is_active:tinyint:0
entity_statuses|id:bigint:0,entity_datum_id:bigint:0,user_id:int:0,source_type:varchar:0,source_id:bigint:0,color:varchar:0,message:varchar:0,created_at:timestamp:0,updated_at:timestamp:0
failed_jobs|id:int:0,uuid:varchar:0,connection:text:0,queue:text:0,payload:longtext:0,exception:longtext:0,failed_at:timestamp:0
fcm_tokens|id:bigint:0,model_type:varchar:0,model_id:bigint:0,token:varchar:0,name:varchar:0,created_at:timestamp:0,updated_at:timestamp:0
features|id:int:0,name:varchar:0,label:varchar:0,type:varchar:0
follow_ups|id:bigint:0,client_id:int:0,follow_up_category_id:bigint:0,name:varchar:0,slug:varchar:0,description:varchar:0,icon:varchar:0,scheme:longtext:1,can_use_json_table:tinyint:0,created_at:timestamp:0,updated_at:timestamp:0
follow_up_categories|id:bigint:0,client_id:int:0,name:varchar:0,order:int:0,created_at:timestamp:0,updated_at:timestamp:0
follow_up_entries|id:bigint:0,client_id:int:0,user_id:int:0,follow_up_id:bigint:0,version_id:bigint:0,data:longtext:1,created_at:timestamp:0,updated_at:timestamp:0
follow_up_entry_submission|submission_id:int:0,follow_up_entry_id:bigint:0,data:longtext:1,created_at:timestamp:0,updated_at:timestamp:0
forms|id:int:0,name:varchar:0,description:varchar:0,avatar:varchar:0,created_at:timestamp:0,updated_at:timestamp:0,accessed_at:timestamp:0,content:longtext:1,force_schema_validity:tinyint:0,client_id:int:0
form_fields|id:int:0,created_at:timestamp:0,updated_at:timestamp:0,name:varchar:0,type:varchar:0,description:varchar:0,config:longtext:1,agent_id:int:0
form_field_clients|form_field_id:int:0,client_id:int:0
groupables|user_group_id:int:0,groupable_type:varchar:0,groupable_id:bigint:0
health_check_result_history_items|id:bigint:0,check_name:varchar:0,check_label:varchar:0,status:varchar:0,notification_message:text:0,short_summary:varchar:0,meta:longtext:1,ended_at:timestamp:0,batch:char:0,created_at:timestamp:0,updated_at:timestamp:0
identities|id:int:0,client_id:int:0,logo:varchar:0,profile_photo:varchar:0,color:varchar:0,contrast_color:varchar:0,topbar_primary:tinyint:0,created_at:timestamp:0,updated_at:timestamp:0,tile_layout:tinyint:0
jobs|id:bigint:0,queue:varchar:0,payload:longtext:0,attempts:tinyint:0,reserved_at:int:0,available_at:int:0,created_at:int:0
job_batches|id:varchar:0,name:varchar:0,total_jobs:int:0,pending_jobs:int:0,failed_jobs:int:0,failed_job_ids:longtext:0,options:mediumtext:0,cancelled_at:int:0,created_at:int:0,finished_at:int:0
media|id:bigint:0,model_type:varchar:0,model_id:bigint:0,uuid:char:0,collection_name:varchar:0,name:varchar:0,file_name:varchar:0,mime_type:varchar:0,disk:varchar:0,original_path:varchar:0,conversions_disk:varchar:0,size:bigint:0,manipulations:longtext:1,custom_properties:longtext:1,generated_conversions:longtext:1,responsive_images:longtext:1,order_column:int:0,created_at:timestamp:0,updated_at:timestamp:0
messages|id:int:0,title:varchar:0,content:longtext:0,push:tinyint:0,mail:tinyint:0,send_to_users:tinyint:0,client_id:int:0,message_type_id:int:0,delivery_option:tinyint:0,send_at:datetime:0,sender_id:int:0,push_notification_id:varchar:0,created_at:timestamp:0,updated_at:timestamp:0,deleted_at:timestamp:0,repeat:enum:0,rrule:varchar:0
messages_read|message_id:int:0,user_id:int:0,read_at:timestamp:0
message_user_group|message_id:int:0,user_group_id:int:0
migrations|id:int:0,migration:varchar:0,batch:int:0
model_has_permissions|permission_id:bigint:0,model_type:varchar:0,model_id:bigint:0,client_id:bigint:0
model_has_roles|id:bigint:0,role_id:bigint:0,model_type:varchar:0,model_id:bigint:0,client_id:bigint:0
notifications|id:char:0,type:varchar:0,notifiable_type:varchar:0,notifiable_id:bigint:0,data:text:0,read_at:timestamp:0,created_at:timestamp:0,updated_at:timestamp:0
oauth_access_tokens|id:varchar:0,user_id:bigint:0,client_id:char:0,name:varchar:0,scopes:text:0,revoked:tinyint:0,created_at:timestamp:0,updated_at:timestamp:0,expires_at:datetime:0
oauth_auth_codes|id:varchar:0,user_id:bigint:0,client_id:char:0,scopes:text:0,revoked:tinyint:0,expires_at:datetime:0
oauth_clients|id:char:0,user_id:bigint:0,name:varchar:0,secret:varchar:0,provider:varchar:0,redirect:text:0,personal_access_client:tinyint:0,password_client:tinyint:0,revoked:tinyint:0,created_at:timestamp:0,updated_at:timestamp:0
oauth_personal_access_clients|id:bigint:0,client_id:char:0,created_at:timestamp:0,updated_at:timestamp:0
oauth_refresh_tokens|id:varchar:0,access_token_id:varchar:0,revoked:tinyint:0,expires_at:datetime:0
password_reset_tokens|email:varchar:0,token:varchar:0,created_at:timestamp:0
pdf_report_configs|id:bigint:0,client_id:int:0,name:varchar:0,slug:varchar:0,icon:varchar:0,scheme:longtext:1,order:bigint:0,created_at:timestamp:0,updated_at:timestamp:0
permissions|id:bigint:0,name:varchar:0,guard_name:varchar:0,created_at:timestamp:0,updated_at:timestamp:0
permissions_old|id:bigint:0,permission:varchar:0,role_id:bigint:0
projects|id:int:0,client_id:int:0,name:varchar:0,created_at:timestamp:0,updated_at:timestamp:0,order:int:0
project_forms|id:int:0,project_id:int:0,form_id:int:0,category_id:int:0,from_date:date:0,to_date:date:0,email_to_submitter:tinyint:0,email_primary:varchar:0,email_secondary:varchar:0,rrule:varchar:0,order:int:0,reset_at_midnight:tinyint:0,show_old_submission:tinyint:0,reset_status_at_midnight:tinyint:0,cache_key_resets:int:0
project_form_user_groups|project_form_id:int:0,user_group_id:int:0
project_user_groups|project_id:int:0,user_group_id:int:0
roles|id:bigint:0,client_id:bigint:0,name:varchar:0,guard_name:varchar:0,created_at:timestamp:0,updated_at:timestamp:0
roles_old|id:bigint:0,name:varchar:0,client_id:int:0
role_has_permissions|permission_id:bigint:0,role_id:bigint:0
sessions|id:varchar:0,user_id:int:0,ip_address:varchar:0,user_agent:text:0,payload:text:0,last_activity:int:0
shortcuts|id:bigint:0,name:varchar:0,url:varchar:0,order:int:0,open_in_tab:tinyint:0,client_id:int:0,shortcut_category_id:bigint:0,created_at:timestamp:0,updated_at:timestamp:0
shortcut_categories|id:bigint:0,client_id:int:0,tab_id:bigint:0,name:varchar:0,description:varchar:0,icon:varchar:0,slug:varchar:0,order:int:0,collapsed:tinyint:0,collapsible:tinyint:0,created_at:timestamp:0,updated_at:timestamp:0
shortcut_tabs|id:bigint:0,client_id:int:0,name:varchar:0,slug:varchar:0,icon:varchar:0,order:bigint:0,created_at:timestamp:0,updated_at:timestamp:0
short_lived_tokens|id:char:0,user_id:int:0,valid_from:timestamp:0,valid_until:timestamp:0,created_at:timestamp:0,updated_at:timestamp:0
submissions|id:int:0,issuer_id:int:0,client_id:int:0,project_form_id:int:0,version_id:bigint:0,data:longtext:1,created_at:timestamp:0,updated_at:timestamp:0,checksum:varchar:0
telescope_entries|sequence:bigint:0,uuid:char:0,batch_id:char:0,family_hash:varchar:0,should_display_on_index:tinyint:0,type:varchar:0,content:longtext:0,created_at:datetime:0
telescope_entries_tags|entry_uuid:char:0,tag:varchar:0
telescope_monitoring|tag:varchar:0
temporary_files|id:bigint:0,disk:varchar:0,path:varchar:0,original_name:varchar:0,mime:varchar:0,user_id:int:0,created_at:timestamp:0,updated_at:timestamp:0
users|id:int:0,agent_id:int:0,name:varchar:0,client_id:int:0,username:varchar:0,email:varchar:0,password:varchar:0,token:varchar:0,profile_image:varchar:0,language:varchar:0,is_active:tinyint:0,login_allowed:tinyint:0,see_other_submissions:tinyint:0,force_logout:tinyint:0,remember_token:varchar:0,claims:longtext:1,data:longtext:1,locked_at:timestamp:0,created_at:timestamp:0,updated_at:timestamp:0,deleted_at:timestamp:0,invite_token:varchar:0
user_groups|id:int:0,name:varchar:0,slug:varchar:0,client_id:int:0,is_system_group:tinyint:0,order:int:0,created_at:timestamp:0,updated_at:timestamp:0
user_group_members|user_group_id:int:0,user_id:int:0
user_measurements|id:bigint:0,type:varchar:0,value:double:0,user_id:int:0,measured_at:timestamp:0
user_meta_fields|id:bigint:0,key:varchar:0,label:varchar:0,order:int:0,client_id:int:0
versions|id:bigint:0,user_id:bigint:0,versionable_type:varchar:0,versionable_id:bigint:0,contents:longtext:1,created_at:timestamp:0,updated_at:timestamp:0,deleted_at:timestamp:0

Here is the user query:
${query.proposedQuery}

And here is the explanation of the query:
${query.queryIntent}
        `,
          tools: {
            executeSQL: tool({
              description: 'Execute a SQL query on the Easylog database',
              inputSchema: z.object({
                query: z.string()
              }),
              execute: async (query) => {
                messageStreamWriter?.write({
                  type: 'data-research',
                  id,
                  data: {
                    status: 'loading',
                    title: 'Executing query',
                    body: `${query.query}`
                  }
                });

                const [result, error] = await tryCatch(
                  easylogDb.execute(query.query)
                );

                if (error) {
                  Sentry.captureException(error);
                  console.error(error);
                  return `Error executing SQL query: ${error.message}`;
                }

                const truncatedResult = truncateStrings(result, 1000);

                const json = JSON.stringify(
                  {
                    result: truncatedResult,
                    explanation: `Successfully executed SQL query: ${query.query}`,
                    error: null
                  },
                  null,
                  2
                );

                return json;
              }
            })
          },
          prepareStep: (step) => {
            if (step.steps.at(-1)?.toolCalls.length === 0) {
              messageStreamWriter?.write({
                type: 'data-research',
                id,
                data: {
                  status: 'loading',
                  title: 'Researching query results'
                }
              });
            }
            return step;
          },
          stopWhen: stepCountIs(5)
        })
      );

      if (error) {
        Sentry.captureException(error);
        console.error(error);
        return `Error executing SQL query: ${error.message}`;
      }

      messageStreamWriter?.write({
        type: 'data-research',
        id,
        data: {
          status: 'complete',
          title: 'Query executed',
          body: result.text
        }
      });

      return {
        result: result.text
      };
    }
  });
};

export default toolExecuteSQL;
