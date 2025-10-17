import * as chartsTools from './charts/config';
import * as coreTools from './core/config';
import * as easylogBackendTools from './easylog-backend/config';
import * as executeSqlTools from './execute-sql/config';
import * as knowledgeBaseTools from './knowledge-base/config';
import * as multipleChoiceTools from './multiple-choice/config';
import * as pqiAuditsTools from './pqi-audits/config';

const toolsConfig = {
  ...chartsTools,
  ...coreTools,
  ...easylogBackendTools,
  ...executeSqlTools,
  ...knowledgeBaseTools,
  ...multipleChoiceTools,
  ...pqiAuditsTools
} as const;

export default toolsConfig;
