import {
  AllocationsApi,
  AnnouncementsApi,
  BulletinApi,
  CalendarApi,
  CategoriesApi,
  Configuration,
  ConfigurationApi,
  DatasourcesApi,
  FollowUpCategoriesApi,
  FollowUpEntriesApi,
  FollowUpsApi,
  FormsApi,
  MediaApi,
  PlanningApi,
  PlanningPhasesApi,
  ReportsApi,
  SubmissionsApi
} from './generated-client/index';

export interface ClientConfig {
  apiKey: string;
  basePath?: string;
}

const createClient = ({
  apiKey,
  basePath = 'https://staging2.easylog.nu/api'
}: ClientConfig) => {
  const bearerToken = `Bearer ${apiKey}`;

  const config = new Configuration({
    basePath,
    accessToken: async () => bearerToken,
    headers: {
      Accept: 'application/json',
      Authorization: bearerToken
    }
  });

  return {
    allocations: new AllocationsApi(config),
    announcements: new AnnouncementsApi(config),
    bulletin: new BulletinApi(config),
    calendar: new CalendarApi(config),
    categories: new CategoriesApi(config),
    configuration: new ConfigurationApi(config),
    datasources: new DatasourcesApi(config),
    media: new MediaApi(config),
    followUpCategories: new FollowUpCategoriesApi(config),
    followUpEntries: new FollowUpEntriesApi(config),
    followUps: new FollowUpsApi(config),
    forms: new FormsApi(config),
    planning: new PlanningApi(config),
    planningPhases: new PlanningPhasesApi(config),
    reports: new ReportsApi(config),
    submissions: new SubmissionsApi(config)
  };
};

export default createClient;
