import * as chartsTools from './charts/config';
import * as easylogBackendTools from './easylog-backend/config';
import * as executeSqlTools from './execute-sql/config';
import * as knowledgeBaseTools from './knowledge-base/config';
import * as multipleChoiceTools from './multiple-choice/config';

const toolsConfig = {
  ...chartsTools,
  ...easylogBackendTools,
  ...executeSqlTools,
  ...knowledgeBaseTools,
  ...multipleChoiceTools
} as const;

export default toolsConfig;
