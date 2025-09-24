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
      .object({})
      .catchall(z.union([z.number(), z.string()]))
      .strict()
      .nullable()
      .describe('Optional additional data as a dictionary or JSON string')
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
      .describe('Fflag to exclude project in workday calculations'),
    start: z.string().describe('New start date in YYYY-MM-DD format'),
    end: z.string().describe('New end date in YYYY-MM-DD format'),
    extraData: z
      .object({})
      .catchall(z.union([z.number(), z.string()]))
      .strict()
      .nullable()
      .describe('Optional additional data as a dictionary or JSON string')
  })
} as const;
