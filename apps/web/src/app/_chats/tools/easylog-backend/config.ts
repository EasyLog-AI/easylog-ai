import z from 'zod';

const resourceAllocationSchema = z.object({
  resourceId: z.number().describe('ID of the resource to allocate'),
  start: z.string().describe('Start date/time of the allocation'),
  end: z.string().describe('End date/time of the allocation'),
  type: z.string().describe('Allocation type (e.g., "modificatiesi")'),
  comment: z
    .string()
    .nullable()
    .describe('Optional comment for the allocation'),
  fields: z
    .array(
      z
        .object({})
        .catchall(z.union([z.number(), z.string()]))
        .strict()
    )
    .describe('Optional additional fields')
});

export const createMultipleAllocationsConfig = {
  name: 'createMultipleAllocations',
  description:
    'Allocate multiple resources to a project in a single operation.',
  inputSchema: z.object({
    projectId: z
      .number()
      .describe('The ID of the project to allocate resources to'),
    group: z
      .string()
      .describe('The name of the resource group to allocate to (e.g., "td")'),
    resources: z
      .array(resourceAllocationSchema)
      .describe('List of resource allocation specifications')
  })
} as const;

export const createPlanningPhaseConfig = {
  name: 'createPlanningPhase',
  description: 'Create a new planning phase for a project.',
  inputSchema: z.object({
    projectId: z
      .number()
      .describe('The ID of the project to create a phase for'),
    slug: z
      .string()
      .describe(
        'Identifier slug for the phase (e.g., "design", "development")'
      ),
    start: z
      .string()
      .describe('Start date for the phase (accepts various date formats)'),
    end: z
      .string()
      .describe('End date for the phase (accepts various date formats)')
  })
} as const;

export const createPlanningProjectConfig = {
  name: 'createPlanningProject',
  description: 'Create a new planning project.',
  inputSchema: z.object({
    datasourceId: z
      .string()
      .describe('The ID of the datasource to create the project in'),
    name: z.string().describe('New name for the project'),
    color: z.string().describe('New color code for the project'),
    reportVisible: z.boolean().describe('Flag to control report visibility'),
    excludeInWorkdays: z
      .boolean()
      .describe('Flag to exclude project in workday calculations'),
    start: z.string().describe('New start date in YYYY-MM-DD format'),
    end: z.string().describe('New end date in YYYY-MM-DD format'),
    extraData: z
      .record(z.union([z.string(), z.number(), z.boolean(), z.null(), z.any()]))
      .nullable()
      .describe(
        'Optional additional data as a JSON object. Keys must exist in extra_data_fields on the datasource'
      )
  })
} as const;

export const deleteAllocationConfig = {
  name: 'deleteAllocation',
  description: 'Delete an allocation',
  inputSchema: z.object({
    allocationId: z.number().describe('The ID of the allocation to delete')
  })
} as const;

export const getDataSourcesConfig = {
  name: 'getDataSources',
  description: 'Get all datasources from Easylog',
  inputSchema: z.object({
    types: z.array(z.string()).describe('Empty array to get all datasources')
  })
} as const;

export const getPlanningPhaseConfig = {
  name: 'getPlanningPhase',
  description: 'Retrieve detailed information about a specific planning phase.',
  inputSchema: z.object({
    phaseId: z.number().describe('The ID of the planning phase to retrieve')
  })
} as const;

export const getPlanningPhasesConfig = {
  name: 'getPlanningPhases',
  description: 'Retrieve all planning phases for a specific project.',
  inputSchema: z.object({
    projectId: z.number().describe('The ID of the project to get phases for')
  })
} as const;

export const getPlanningProjectConfig = {
  name: 'getPlanningProject',
  description:
    'Retrieve detailed information about a specific planning project.',
  inputSchema: z.object({
    projectId: z.number().describe('The ID of the planning project to retrieve')
  })
} as const;

export const getPlanningProjectsConfig = {
  name: 'getPlanningProjects',
  description:
    'Retrieve all planning projects available for allocation within a date range.',
  inputSchema: z.object({
    startDate: z
      .string()
      .nullable()
      .describe('Optional start date in YYYY-MM-DD format'),
    endDate: z
      .string()
      .nullable()
      .describe('Optional end date in YYYY-MM-DD format')
  })
} as const;

export const getProjectsOfResourceConfig = {
  name: 'getProjectsOfResource',
  description:
    'Retrieve all projects associated with a specific resource and allocation type.',
  inputSchema: z.object({
    resourceId: z.number().describe('The ID of the resource group'),
    datasourceSlug: z
      .string()
      .describe('The slug of the allocation type (e.g., "td", "modificaties")')
  })
} as const;

export const getResourceGroupsConfig = {
  name: 'getResourceGroups',
  description:
    'Retrieve all resource groups for a specific resource and group slug.',
  inputSchema: z.object({
    resourceId: z.number().describe('The ID of the resource'),
    resourceSlug: z
      .string()
      .describe('The slug identifier for the resource group')
  })
} as const;

export const getResourcesConfig = {
  name: 'getResources',
  description: 'Retrieve all available resources in the system.',
  inputSchema: z.object({})
} as const;

const resourceAllocationUpdateSchema = z.object({
  id: z.number().describe('ID of the existing allocation to update'),
  start: z.string().describe('Start date/time of the allocation'),
  end: z.string().describe('End date/time of the allocation'),
  type: z
    .string()
    .nullable()
    .optional()
    .describe(
      'Allocation type (e.g., "modificatiesi"). If omitted, will not be updated'
    ),
  comment: z
    .string()
    .nullable()
    .optional()
    .describe(
      'Optional comment for the allocation. If omitted, will not be updated'
    ),
  parentId: z
    .number()
    .nullable()
    .optional()
    .describe('Parent allocation ID. If omitted, will not be updated'),
  fields: z
    .array(
      z
        .object({})
        .catchall(z.union([z.number(), z.string()]))
        .strict()
    )
    .nullable()
    .optional()
    .describe('Optional additional fields. If omitted, will not be updated')
});

export const updateMultipleAllocationsConfig = {
  name: 'updateMultipleAllocations',
  description:
    'Update multiple existing resource allocations in a single operation. Only the fields provided will be updated.',
  inputSchema: z.object({
    allocations: z
      .array(resourceAllocationUpdateSchema)
      .describe(
        'List of allocation updates. Each allocation must include an ID and the fields to update'
      )
  })
} as const;

export const updatePlanningPhaseConfig = {
  name: 'updatePlanningPhase',
  description: 'Update the date range of an existing planning phase.',
  inputSchema: z.object({
    phaseId: z.number().describe('The ID of the phase to update'),
    start: z.string().describe('New start date (accepts various date formats)'),
    end: z.string().describe('New end date (accepts various date formats)')
  })
} as const;

export const updatePlanningProjectConfig = {
  name: 'updatePlanningProject',
  description: 'Update properties of an existing planning project.',
  inputSchema: z.object({
    projectId: z.number().describe('The ID of the project to update'),
    name: z.string().describe('New name for the project'),
    color: z.string().describe('New color code for the project'),
    reportVisible: z.boolean().describe('Flag to control report visibility'),
    excludeInWorkdays: z
      .boolean()
      .describe('Flag to exclude project in workday calculations'),
    start: z.string().describe('New start date in YYYY-MM-DD format'),
    end: z.string().describe('New end date in YYYY-MM-DD format'),
    extraData: z
      .record(z.union([z.string(), z.number(), z.boolean(), z.null(), z.any()]))
      .nullable()
      .describe(
        'Optional additional data as a JSON object. Keys must exist in extra_data_fields on the datasource'
      )
  })
} as const;

// Follow-ups

export const listFollowUpsConfig = {
  name: 'listFollowUps',
  description:
    'Retrieve follow-ups for the current client (paginated, returns first 25 by default). Follow-ups are filtered by user group membership unless the user has the FollowUpOverrideGroups permission.',
  inputSchema: z.object({
    page: z
      .number()
      .default(1)
      .describe('Page number for pagination (default: 1)'),
    perPage: z
      .number()
      .min(1)
      .max(100)
      .default(25)
      .describe('Number of items per page (1-100, default: 25)')
  })
} as const;

export const showFollowUpConfig = {
  name: 'showFollowUp',
  description: 'Retrieve detailed information about a specific follow-up.',
  inputSchema: z.object({
    followUpId: z.number().describe('The ID of the follow-up to retrieve')
  })
} as const;

export const createFollowUpConfig = {
  name: 'createFollowUp',
  description:
    'Create a new follow-up form definition for the current client. Follow-ups are form templates that users can fill out.',
  inputSchema: z.object({
    name: z.string().describe('The name/title of the follow-up form'),
    slug: z
      .string()
      .describe(
        'Unique slug identifier for the follow-up (e.g., "incident-report")'
      ),
    description: z
      .string()
      .nullable()
      .optional()
      .describe('Optional description of the follow-up form'),
    followUpCategoryId: z
      .number()
      .nullable()
      .optional()
      .describe('Optional category ID to group this follow-up under'),
    icon: z
      .string()
      .nullable()
      .optional()
      .describe('Optional icon name for the follow-up'),
    scheme: z
      .record(z.any())
      .describe('JSON schema defining the form fields and structure'),
    canUseJsonTable: z
      .boolean()
      .nullable()
      .optional()
      .describe('Whether this follow-up can use JSON table view')
  })
} as const;

export const updateFollowUpConfig = {
  name: 'updateFollowUp',
  description: 'Update an existing follow-up form definition.',
  inputSchema: z.object({
    followUpId: z.number().describe('The ID of the follow-up to update'),
    name: z
      .string()
      .nullable()
      .optional()
      .describe('The name/title of the follow-up form'),
    slug: z
      .string()
      .nullable()
      .optional()
      .describe('Unique slug identifier for the follow-up'),
    description: z
      .string()
      .nullable()
      .optional()
      .describe('Optional description of the follow-up form'),
    followUpCategoryId: z
      .number()
      .nullable()
      .optional()
      .describe('Optional category ID to group this follow-up under'),
    icon: z
      .string()
      .nullable()
      .optional()
      .describe('Optional icon name for the follow-up'),
    scheme: z
      .record(z.any())
      .nullable()
      .optional()
      .describe('JSON schema defining the form fields and structure'),
    canUseJsonTable: z
      .boolean()
      .nullable()
      .optional()
      .describe('Whether this follow-up can use JSON table view')
  })
} as const;

export const deleteFollowUpConfig = {
  name: 'deleteFollowUp',
  description: 'Delete a follow-up.',
  inputSchema: z.object({
    followUpId: z.number().describe('The ID of the follow-up to delete')
  })
} as const;

export const listFollowUpEntriesConfig = {
  name: 'listFollowUpEntries',
  description:
    'List entries for a specific follow-up (paginated, returns first 25 by default). Entries represent submitted data for a follow-up form.',
  inputSchema: z.object({
    followUpId: z
      .number()
      .describe('The ID of the follow-up to list entries for'),
    page: z
      .number()
      .default(1)
      .describe('Page number for pagination (default: 1)'),
    perPage: z
      .number()
      .min(1)
      .max(100)
      .default(25)
      .describe('Number of items per page (1-100, default: 25)')
  })
} as const;

export const showFollowUpEntryConfig = {
  name: 'showFollowUpEntry',
  description: 'Retrieve details for a specific follow-up entry.',
  inputSchema: z.object({
    followUpEntryId: z
      .number()
      .describe('The ID of the follow-up entry to retrieve')
  })
} as const;

export const createFollowUpEntryConfig = {
  name: 'createFollowUpEntry',
  description:
    'Create a new follow-up entry by submitting data for a follow-up form.',
  inputSchema: z.object({
    followUpId: z
      .number()
      .describe('The ID of the follow-up to create an entry for'),
    data: z
      .record(z.any())
      .describe('JSON object containing the submitted follow-up data')
  })
} as const;

export const updateFollowUpEntryConfig = {
  name: 'updateFollowUpEntry',
  description: 'Update the data of an existing follow-up entry.',
  inputSchema: z.object({
    followUpEntryId: z
      .number()
      .describe('The ID of the follow-up entry to update'),
    data: z
      .record(z.any())
      .describe('Updated JSON object containing the follow-up data')
  })
} as const;

export const deleteFollowUpEntryConfig = {
  name: 'deleteFollowUpEntry',
  description: 'Delete a follow-up entry.',
  inputSchema: z.object({
    followUpEntryId: z
      .number()
      .describe('The ID of the follow-up entry to delete')
  })
} as const;

export const listFollowUpCategoriesConfig = {
  name: 'listFollowUpCategories',
  description:
    'List follow-up categories available to the current user (paginated, returns first 25 by default). Categories may be filtered based on group membership.',
  inputSchema: z.object({
    page: z
      .number()
      .default(1)
      .describe('Page number for pagination (default: 1)'),
    perPage: z
      .number()
      .min(1)
      .max(100)
      .default(25)
      .describe('Number of items per page (1-100, default: 25)')
  })
} as const;

export const showFollowUpCategoryConfig = {
  name: 'showFollowUpCategory',
  description: 'Retrieve details for a specific follow-up category.',
  inputSchema: z.object({
    categoryId: z.number().describe('The ID of the follow-up category to fetch')
  })
} as const;

export const listFormsConfig = {
  name: 'listForms',
  description:
    'List forms available in Easylog (paginated, returns first 25 forms by default). This endpoint returns lightweight form metadata without the heavy content field. To get complete form details including schema, use showForm with a specific form ID.',
  inputSchema: z.object({
    page: z
      .number()
      .default(1)
      .describe('Page number for pagination (default: 1)'),
    perPage: z
      .number()
      .min(1)
      .max(100)
      .default(25)
      .describe('Number of items per page (1-100, default: 25)')
  })
} as const;

export const showFormConfig = {
  name: 'showForm',
  description:
    'Retrieve complete details for a specific form, including metadata AND the full form content/schema. Use this after listForms() when you need to see or analyze the actual form structure.',
  inputSchema: z.object({
    formId: z.number().describe('The ID of the form to retrieve')
  })
} as const;

export const listProjectFormsConfig = {
  name: 'listProjectForms',
  description:
    'List all ProjectForms (form-to-project associations) for a specific form. This helps map from a form ID to project form IDs which are needed for submissions. Each ProjectForm represents an instance of a form attached to a specific project.',
  inputSchema: z.object({
    formId: z.number().describe('The ID of the form to get project forms for')
  })
} as const;

export const createFormConfig = {
  name: 'createForm',
  description:
    'Create a new form definition. The content should be a JSON schema string or object describing the form layout.',
  inputSchema: z.object({
    name: z.string().describe('The name of the form'),
    description: z
      .string()
      .nullable()
      .optional()
      .describe('Optional description for the form'),
    avatar: z
      .string()
      .nullable()
      .optional()
      .describe('Optional avatar/image identifier for the form'),
    content: z
      .union([z.string(), z.record(z.any())])
      .describe(
        'Form schema content as a JSON string or object that will be stringified'
      ),
    forceSchemaValidity: z
      .boolean()
      .nullable()
      .optional()
      .describe(
        'Set to true to enforce schema validation even if issues are detected'
      )
  })
} as const;

export const updateFormConfig = {
  name: 'updateForm',
  description: 'Update an existing form definition.',
  inputSchema: z.object({
    formId: z.number().describe('The ID of the form to update'),
    name: z.string().nullable().optional().describe('Updated name of the form'),
    description: z
      .string()
      .nullable()
      .optional()
      .describe('Updated description for the form'),
    avatar: z
      .string()
      .nullable()
      .optional()
      .describe('Updated avatar/image identifier for the form'),
    content: z
      .union([z.string(), z.record(z.any())])
      .nullable()
      .optional()
      .describe(
        'Updated form schema as a JSON string or object that will be stringified'
      ),
    forceSchemaValidity: z
      .boolean()
      .nullable()
      .optional()
      .describe(
        'Set to true to enforce schema validation even if issues are detected'
      )
  })
} as const;

export const deleteFormConfig = {
  name: 'deleteForm',
  description: 'Delete an existing form.',
  inputSchema: z.object({
    formId: z.number().describe('The ID of the form to delete')
  })
} as const;

// Submissions

export const listSubmissionsConfig = {
  name: 'listSubmissions',
  description:
    'Retrieve submissions for the current user (paginated, returns first 25 by default). Regular users only see their own submissions. Users with ViewAllSubmissions permission can see all submissions in their client and filter by issuer_id.',
  inputSchema: z.object({
    page: z
      .number()
      .default(1)
      .describe('Page number for pagination (default: 1)'),
    perPage: z
      .number()
      .min(1)
      .max(100)
      .default(25)
      .describe('Number of items per page (1-100, default: 25)'),
    projectFormId: z
      .number()
      .nullable()
      .optional()
      .describe('Optional filter by project form ID'),
    issuerId: z
      .number()
      .nullable()
      .optional()
      .describe(
        'Optional filter by issuer ID (requires ViewAllSubmissions permission)'
      ),
    from: z
      .string()
      .nullable()
      .optional()
      .describe('Optional filter for submissions from this date (YYYY-MM-DD)'),
    to: z
      .string()
      .nullable()
      .optional()
      .describe('Optional filter for submissions until this date (YYYY-MM-DD)'),
    with: z
      .string()
      .nullable()
      .optional()
      .describe(
        'Optional comma-separated list of relations to include (e.g. "form,issuer,media")'
      )
  })
} as const;

export const showSubmissionConfig = {
  name: 'showSubmission',
  description:
    'Display a specific submission. Users can only view submissions they created or if they have ViewAllSubmissions permission.',
  inputSchema: z.object({
    submissionId: z.number().describe('The ID of the submission to retrieve')
  })
} as const;

export const createSubmissionConfig = {
  name: 'createSubmission',
  description:
    'Create and persist a new submission with form data. This is a simplified version that does not support file uploads. For file uploads, use prepareSubmission first.',
  inputSchema: z.object({
    projectFormId: z
      .number()
      .describe('The ID of the project form to submit to'),
    formVersionId: z
      .number()
      .describe('The ID of the form version being submitted'),
    data: z.record(z.any()).describe('The form data as a key-value object')
  })
} as const;

export const updateSubmissionConfig = {
  name: 'updateSubmission',
  description:
    'Update submission data. Users can only update submissions they created or if they have ViewAllSubmissions permission. Only the data field can be updated.',
  inputSchema: z.object({
    submissionId: z.number().describe('The ID of the submission to update'),
    data: z
      .record(z.any())
      .describe('The updated form data as a key-value object')
  })
} as const;

export const deleteSubmissionConfig = {
  name: 'deleteSubmission',
  description:
    'Delete a submission and all associated media. Users can only delete submissions they created or if they have ViewAllSubmissions permission.',
  inputSchema: z.object({
    submissionId: z.number().describe('The ID of the submission to delete')
  })
} as const;

export const listSubmissionMediaConfig = {
  name: 'listSubmissionMedia',
  description: 'Get all media files attached to a submission.',
  inputSchema: z.object({
    submissionId: z
      .number()
      .describe('The ID of the submission to get media for')
  })
} as const;

export const showSubmissionMediaConfig = {
  name: 'showSubmissionMedia',
  description:
    'Display a specific media file from a submission directly in the chat. Shows images inline and provides download links for PDFs and other files. Use listSubmissionMedia first to get available media IDs and details.',
  inputSchema: z.object({
    mediaId: z
      .union([z.number(), z.string()])
      .describe('The ID or UUID of the media file to display'),
    size: z
      .enum(['preview', 'detail', 'original'])
      .default('detail')
      .describe(
        'Image size to display: preview (150x150 thumbnail), detail (550px height), or original (full size). Default: detail'
      )
  })
} as const;

export const prepareSubmissionConfig = {
  name: 'prepareSubmission',
  description:
    'Prepare file uploads for a submission by generating pre-signed URLs. Call this before uploading files.',
  inputSchema: z.object({
    projectFormId: z
      .number()
      .describe('The ID of the project form that owns the submission'),
    files: z
      .array(
        z.object({
          name: z
            .string()
            .describe(
              'File name (including extension) to be uploaded, this must be a file that was previously uploaded in the chat'
            ),
          mime: z.string().describe('MIME type of the file')
        })
      )
      .describe('List of files that will be uploaded for this submission')
  })
} as const;

export const uploadSubmissionMediaConfig = {
  name: 'uploadSubmissionMedia',
  description:
    'Upload a single media file and attach it to an existing submission. Use prepareSubmission first when uploading large files.',
  inputSchema: z.object({
    submissionId: z
      .number()
      .describe('The ID of the submission to attach the media to'),
    fileName: z
      .string()
      .describe(
        'Name of the file including extension, this must be a file that was previously uploaded in the chat'
      )
  })
} as const;

export const listFollowUpEntryMediaConfig = {
  name: 'listFollowUpEntryMedia',
  description: 'Get all media files attached to a follow-up entry.',
  inputSchema: z.object({
    followUpEntryId: z
      .number()
      .describe('The ID of the follow-up entry to get media for')
  })
} as const;

export const uploadFollowUpEntryMediaConfig = {
  name: 'uploadFollowUpEntryMedia',
  description:
    'Upload a single media file and attach it to an existing follow-up entry.',
  inputSchema: z.object({
    followUpEntryId: z
      .number()
      .describe('The ID of the follow-up entry to attach the media to'),
    fileName: z
      .string()
      .describe(
        'Name of the file including extension, this must be a file that was previously uploaded in the chat'
      )
  })
} as const;
