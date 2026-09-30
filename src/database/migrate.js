import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDbClient, execute, query, closeDatabase } from './client.js';
import { validateEnvironment } from '../config/environment.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

/**
 * Runs pending SQL migrations against the remote Turso database.
 */
export async function runMigrations() {
  logger.info('Starting Turso database migration runner...');

  // Validate database environment variables
  const validation = validateEnvironment({ requireDiscord: false, requireTurso: true });
  if (!validation.valid) {
    logger.error(`Migration halted. Missing required environment variables: ${validation.missing.join(', ')}`);
    logger.error('Please configure your .env file with TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.');
    process.exit(1);
  }

  try {
    // 1. Ensure migrations tracking table exists
    await execute(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Fetch already applied migrations
    const appliedRows = await query('SELECT name FROM _migrations ORDER BY id ASC');
    const appliedSet = new Set(appliedRows.map((r) => r.name));

    // 3. Read migration files from directory
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      logger.warn(`Migrations directory not found at: ${MIGRATIONS_DIR}`);
      return;
    }

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    logger.info(`Found ${files.length} migration file(s) in repository.`);

    let appliedCount = 0;

    for (const file of files) {
      if (appliedSet.has(file)) {
        logger.debug(`Skipping already applied migration: ${file}`);
        continue;
      }

      logger.info(`Applying migration: ${file}...`);
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sqlContent = fs.readFileSync(filePath, 'utf8');

      // Split statements on semicolon while ignoring empty statements
      const statements = sqlContent
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      // Execute each statement in migration
      for (const stmt of statements) {
        await execute(stmt);
      }

      // Record migration as applied
      await execute('INSERT INTO _migrations (name) VALUES (?)', [file]);
      appliedCount++;
      logger.info(`Successfully applied migration: ${file}`);
    }

    if (appliedCount === 0) {
      logger.info('Database is already up to date. No pending migrations.');
    } else {
      logger.info(`Migration completed successfully! Applied ${appliedCount} migration(s).`);
    }
  } catch (error) {
    logger.error(`Migration failed with error: ${error.message}`);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

// Allow direct execution via `node src/database/migrate.js` or `npm run db:migrate`
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations();
}
