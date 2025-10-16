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
      .describe('Optional additional data as a JSON object. Keys must exist in extra_data_fields on the datasource')
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
      .describe('Optional additional data as a JSON object. Keys must exist in extra_data_fields on the datasource')
  })
} as const;

// Follow-ups

export const listFollowUpsConfig = {
  name: 'listFollowUps',
  description: 'Retrieve all follow-ups for the current client. Follow-ups are filtered by user group membership unless the user has the FollowUpOverrideGroups permission.',
  inputSchema: z.object({})
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
  description: 'Create a new follow-up form definition for the current client. Follow-ups are form templates that users can fill out.',
  inputSchema: z.object({
    name: z.string().describe('The name/title of the follow-up form'),
    slug: z.string().describe('Unique slug identifier for the follow-up (e.g., "incident-report")'),
    description: z.string().nullable().optional().describe('Optional description of the follow-up form'),
    followUpCategoryId: z.number().nullable().optional().describe('Optional category ID to group this follow-up under'),
    icon: z.string().nullable().optional().describe('Optional icon name for the follow-up'),
    scheme: z.record(z.any()).describe('JSON schema defining the form fields and structure'),
    canUseJsonTable: z.boolean().nullable().optional().describe('Whether this follow-up can use JSON table view')
  })
} as const;

export const updateFollowUpConfig = {
  name: 'updateFollowUp',
  description: 'Update an existing follow-up form definition.',
  inputSchema: z.object({
    followUpId: z.number().describe('The ID of the follow-up to update'),
    name: z.string().nullable().optional().describe('The name/title of the follow-up form'),
    slug: z.string().nullable().optional().describe('Unique slug identifier for the follow-up'),
    description: z.string().nullable().optional().describe('Optional description of the follow-up form'),
    followUpCategoryId: z.number().nullable().optional().describe('Optional category ID to group this follow-up under'),
    icon: z.string().nullable().optional().describe('Optional icon name for the follow-up'),
    scheme: z.record(z.any()).nullable().optional().describe('JSON schema defining the form fields and structure'),
    canUseJsonTable: z.boolean().nullable().optional().describe('Whether this follow-up can use JSON table view')
  })
} as const;

export const deleteFollowUpConfig = {
  name: 'deleteFollowUp',
  description: 'Delete a follow-up.',
  inputSchema: z.object({
    followUpId: z.number().describe('The ID of the follow-up to delete')
  })
} as const;

// Submissions

export const listSubmissionsConfig = {
  name: 'listSubmissions',
  description: 'Retrieve all submissions for the current user. Regular users only see their own submissions. Users with ViewAllSubmissions permission can see all submissions in their client and filter by issuer_id.',
  inputSchema: z.object({
    projectFormId: z.number().optional().describe('Optional filter by project form ID'),
    issuerId: z.number().optional().describe('Optional filter by issuer ID (requires ViewAllSubmissions permission)'),
    from: z.string().optional().describe('Optional filter for submissions from this date (YYYY-MM-DD)'),
    to: z.string().optional().describe('Optional filter for submissions until this date (YYYY-MM-DD)'),
    with: z.string().optional().describe('Optional comma-separated list of relations to include (e.g. "form,issuer,media")')
  })
} as const;

export const showSubmissionConfig = {
  name: 'showSubmission',
  description: 'Display a specific submission. Users can only view submissions they created or if they have ViewAllSubmissions permission.',
  inputSchema: z.object({
    submissionId: z.number().describe('The ID of the submission to retrieve')
  })
} as const;

export const createSubmissionConfig = {
  name: 'createSubmission',
  description: 'Create and persist a new submission with form data. This is a simplified version that does not support file uploads. For file uploads, use prepareSubmission first.',
  inputSchema: z.object({
    projectFormId: z.number().describe('The ID of the project form to submit to'),
    formVersionId: z.number().describe('The ID of the form version being submitted'),
    data: z.record(z.any()).describe('The form data as a key-value object'),
    checksum: z.string().optional().describe('Optional checksum for validation')
  })
} as const;

export const updateSubmissionConfig = {
  name: 'updateSubmission',
  description: 'Update submission data. Users can only update submissions they created or if they have ViewAllSubmissions permission. Only the data field can be updated.',
  inputSchema: z.object({
    submissionId: z.number().describe('The ID of the submission to update'),
    data: z.record(z.any()).describe('The updated form data as a key-value object')
  })
} as const;

export const deleteSubmissionConfig = {
  name: 'deleteSubmission',
  description: 'Delete a submission and all associated media. Users can only delete submissions they created or if they have ViewAllSubmissions permission.',
  inputSchema: z.object({
    submissionId: z.number().describe('The ID of the submission to delete')
  })
} as const;

export const listSubmissionMediaConfig = {
  name: 'listSubmissionMedia',
  description: 'Get all media files attached to a submission.',
  inputSchema: z.object({
    submissionId: z.number().describe('The ID of the submission to get media for')
  })
} as const;
