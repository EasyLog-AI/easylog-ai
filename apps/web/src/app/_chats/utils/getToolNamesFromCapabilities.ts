import { AgentCapabilities } from '@/database/schema';

/** Maps agent capabilities to their corresponding tool names */
const getToolNamesFromCapabilities = (
  capabilities: AgentCapabilities | null | undefined
): string[] => {
  if (!capabilities) {
    return []; // No capabilities specified = no tools
  }

  const toolNames: string[] = [];

  // Core tools (always available if core capability is enabled)
  if (capabilities.core) {
    toolNames.push('clearChat', 'changeRole');
  }

  // Charts capability
  if (capabilities.charts) {
    toolNames.push(
      'createBarChart',
      'createLineChart',
      'createPieChart',
      'createStackedBarChart'
    );
  }

  // Planning capability
  if (capabilities.planning) {
    toolNames.push(
      'getDatasources',
      'getPlanningProjects',
      'getPlanningProject',
      'createPlanningProject',
      'updatePlanningProject',
      'getPlanningPhases',
      'getPlanningPhase',
      'updatePlanningPhase',
      'createPlanningPhase',
      'getResources',
      'getProjectsOfResource',
      'getResourceGroups',
      'createMultipleAllocations',
      'updateMultipleAllocations',
      'deleteAllocation'
    );
  }

  // SQL capability
  if (capabilities.sql) {
    toolNames.push('executeSql');
  }

  // Knowledge base capability
  if (capabilities.knowledgeBase) {
    toolNames.push('searchKnowledgeBase', 'loadDocument');
  }

  // Memories capability
  if (capabilities.memories) {
    toolNames.push('createMemory', 'deleteMemory');
  }

  // Multiple choice capability
  if (capabilities.multipleChoice) {
    toolNames.push('createMultipleChoice', 'answerMultipleChoice');
  }

  // RET audits capability
  if (capabilities.retAudits) {
    toolNames.push(
      'getAuditSubmissions',
      'getAuditTrends',
      'getObservationsAnalysis',
      'getVehicleRanking'
    );
  }

  // Follow-ups capability
  if (capabilities.followUps) {
    toolNames.push(
      'listFollowUps',
      'showFollowUp',
      'createFollowUp',
      'updateFollowUp',
      'deleteFollowUp',
      'listFollowUpEntries',
      'showFollowUpEntry',
      'createFollowUpEntry',
      'updateFollowUpEntry',
      'deleteFollowUpEntry',
      'listFollowUpCategories',
      'showFollowUpCategory',
      'listForms',
      'showForm',
      'listProjectForms',
      'createForm',
      'updateForm',
      'deleteForm'
    );
  }

  // Submissions capability
  if (capabilities.submissions) {
    toolNames.push(
      'listSubmissions',
      'showSubmission',
      'createSubmission',
      'updateSubmission',
      'deleteSubmission',
      'listSubmissionMedia',
      'prepareSubmission',
      'uploadSubmissionMedia'
    );
  }

  return toolNames;
};

export default getToolNamesFromCapabilities;
