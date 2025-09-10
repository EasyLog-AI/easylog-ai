import serverEnv from './server.env';
import getAppUrl from './utils/get-app-url';

const serverConfig = {
  env: serverEnv.NODE_ENV,
  appUrl: getAppUrl(),
  dbUrl: serverEnv.DB_URL,
  openrouterApiKey: serverEnv.OPENROUTER_API_KEY,
  openaiApiKey: serverEnv.OPENAI_API_KEY,
  s3Endpoint: serverEnv.S3_ENDPOINT,
  s3Region: serverEnv.S3_REGION,
  s3AccessKey: serverEnv.S3_ACCESS_KEY,
  s3SecretKey: serverEnv.S3_SECRET_KEY,
  s3PublicBucketName: serverEnv.S3_PUBLIC_BUCKET_NAME,
  triggerSecretKey: serverEnv.TRIGGER_SECRET_KEY,
  betterAuthSecret: serverEnv.BETTER_AUTH_SECRET,
  easylogDbHost: serverEnv.EASYLOG_DB_HOST,
  easylogDbPort: serverEnv.EASYLOG_DB_PORT,
  easylogDbUser: serverEnv.EASYLOG_DB_USER,
  easylogDbName: serverEnv.EASYLOG_DB_NAME,
  easylogDbPassword: serverEnv.EASYLOG_DB_PASSWORD,
  vercelBlobReadWriteToken: serverEnv.BLOB_READ_WRITE_TOKEN,
  /** This config is used as the default prompt for new agents. */
  defaultAgentConfig: {
    model: 'openai/gpt-4.1',
    prompt: `You are a personal assistant participating in a chat with {{user.name}}. Always greet the user at the start of the conversation using their first name.`,
    reasoning: {
      enabled: false,
      effort: 'low'
    }
  }
} as const;

export default serverConfig;
