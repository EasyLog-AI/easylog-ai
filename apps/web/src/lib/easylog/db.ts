import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

import serverConfig from '@/server.config';

/**
 * Lazy database connection - only creates connection when first accessed This
 * prevents connection errors at server startup when SSH tunnel isn't ready
 */
let connectionPromise: Promise<mysql.Connection> | null = null;

const getConnection = async () => {
  if (!connectionPromise) {
    connectionPromise = mysql.createConnection({
      host: serverConfig.easylogDbHost,
      port: serverConfig.easylogDbPort,
      user: serverConfig.easylogDbUser,
      password: serverConfig.easylogDbPassword,
      database: serverConfig.easylogDbName
    });
  }
  return connectionPromise;
};

const getEasylogDb = async () => {
  const connection = await getConnection();
  return drizzle({ client: connection });
};

export default getEasylogDb;
