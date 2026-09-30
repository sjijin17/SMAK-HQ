import { createClient } from '@libsql/client';
import { env } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { DatabaseError } from '../utils/errors.js';

/**
 * Turso / libSQL Remote Database Client Singleton
 * Enforces remote connection and parameterized SQL execution.
 */

let dbClientInstance = null;

/**
 * Initializes and returns the remote Turso libSQL client.
 * Does NOT allow fallback to local files.
 * @returns {import('@libsql/client').Client}
 */
export function getDbClient() {
  if (dbClientInstance) {
    return dbClientInstance;
  }

  if (!env.TURSO_DATABASE_URL || !env.TURSO_AUTH_TOKEN) {
    throw new DatabaseError(
      'Turso database credentials missing. Please set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in your environment.'
    );
  }

  // Prevent local sqlite file creation
  if (
    env.TURSO_DATABASE_URL.startsWith('file:') || 
    env.TURSO_DATABASE_URL.endsWith('.sqlite') || 
    env.TURSO_DATABASE_URL.endsWith('.db')
  ) {
    throw new DatabaseError(
      'Local SQLite files are forbidden. TURSO_DATABASE_URL must be a remote Turso endpoint (e.g., libsql://... or https://...).'
    );
  }

  try {
    dbClientInstance = createClient({
      url: env.TURSO_DATABASE_URL,
      authToken: env.TURSO_AUTH_TOKEN,
    });

    logger.info('Turso remote database client initialized successfully.');
    return dbClientInstance;
  } catch (error) {
    logger.error('Failed to initialize Turso database client:', error);
    throw new DatabaseError('Failed to initialize Turso database connection.', error);
  }
}

/**
 * Executes a parameterized SQL statement (INSERT, UPDATE, DELETE, CREATE).
 * @param {string} sql - SQL string with ? or named placeholders
 * @param {Array<any>|Object} [args=[]] - Parameter arguments (never concatenate values directly!)
 * @returns {Promise<import('@libsql/client').ResultSet>}
 */
export async function execute(sql, args = []) {
  const client = getDbClient();
  try {
    return await client.execute({ sql, args });
  } catch (error) {
    logger.error(`Database execute failed: ${error.message}`);
    throw new DatabaseError(`Database execution error: ${error.message}`, error);
  }
}

/**
 * Queries rows using parameterized inputs (SELECT).
 * @param {string} sql - Parameterized SELECT statement
 * @param {Array<any>|Object} [args=[]] - Safe arguments
 * @returns {Promise<Array<any>>} Array of row objects
 */
export async function query(sql, args = []) {
  const client = getDbClient();
  try {
    const result = await client.execute({ sql, args });
    return result.rows || [];
  } catch (error) {
    logger.error(`Database query failed: ${error.message}`);
    throw new DatabaseError(`Database query error: ${error.message}`, error);
  }
}

/**
 * Queries a single row using parameterized inputs.
 * @param {string} sql
 * @param {Array<any>|Object} [args=[]]
 * @returns {Promise<any|null>} The first row object or null
 */
export async function queryOne(sql, args = []) {
  const rows = await query(sql, args);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Executes multiple statements within a single batch/transaction.
 * @param {Array<{sql: string, args?: Array<any>}>} statements
 * @param {'deferred'|'immediate'|'exclusive'} [mode='deferred']
 * @returns {Promise<Array<import('@libsql/client').ResultSet>>}
 */
export async function batch(statements, mode = 'deferred') {
  const client = getDbClient();
  try {
    return await client.batch(statements, mode);
  } catch (error) {
    logger.error(`Database batch transaction failed: ${error.message}`);
    throw new DatabaseError(`Database transaction error: ${error.message}`, error);
  }
}

/**
 * Tests connectivity to the remote Turso database.
 * @returns {Promise<{ ok: boolean, latencyMs: number, error?: string }>}
 */
export async function pingDatabase() {
  const start = Date.now();
  try {
    const client = getDbClient();
    await client.execute('SELECT 1 AS ping');
    const latencyMs = Date.now() - start;
    return { ok: true, latencyMs };
  } catch (error) {
    const latencyMs = Date.now() - start;
    return { 
      ok: false, 
      latencyMs, 
      error: error.message || 'Unknown database connection error' 
    };
  }
}

/**
 * Closes the database client on application shutdown.
 */
export async function closeDatabase() {
  if (dbClientInstance && typeof dbClientInstance.close === 'function') {
    try {
      await dbClientInstance.close();
      logger.info('Turso database connection closed gracefully.');
    } catch (error) {
      logger.warn('Error while closing database client:', error.message);
    } finally {
      dbClientInstance = null;
    }
  }
}

export default {
  getDbClient,
  execute,
  query,
  queryOne,
  batch,
  pingDatabase,
  closeDatabase,
};
