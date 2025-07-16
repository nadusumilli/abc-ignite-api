import { Pool, PoolClient } from 'pg';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

/**
 * Database migration system with comprehensive error handling and logging
 * Supports forward and backward migrations with transaction safety
 */
class DatabaseMigrator {
  private pool: Pool;
  private migrationsPath: string;

  constructor() {
    this.pool = new Pool({
      host: process.env['DB_HOST'] || 'localhost',
      port: parseInt(process.env['DB_PORT'] || '5432'),
      database: process.env['DB_NAME'] || 'abc_ignite',
      user: process.env['DB_USER'] || 'postgres',
      password: process.env['DB_PASSWORD'] || 'postgres',

      // Connection pool settings for maximum performance
      max: parseInt(process.env['DB_POOL_MAX'] || '20'), // Maximum number of clients
      min: parseInt(process.env['DB_POOL_MIN'] || '2'),  // Minimum number of clients

      // Connection settings
      connectionTimeoutMillis: parseInt(process.env['DB_CONNECTION_TIMEOUT'] || '10000'),
      idleTimeoutMillis: parseInt(process.env['DB_IDLE_TIMEOUT'] || '30000'),
      query_timeout: parseInt(process.env['DB_QUERY_TIMEOUT'] || '30000'),
      statement_timeout: parseInt(process.env['DB_STATEMENT_TIMEOUT'] || '30000'),
    });

    this.migrationsPath = path.join(__dirname, 'migrations');
  }

  /**
   * Initialize the migration system by creating the migrations table
   * @returns {Promise<void>}
   */
  async initialize(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          checksum VARCHAR(64) NOT NULL,
          execution_time_ms INTEGER NOT NULL
        );
      `);
      
      console.log('✅ Migration system initialized');
    } catch (error) {
      console.error('❌ Failed to initialize migration system:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get list of migration files from the migrations directory
   * @returns {Promise<string[]>} Array of migration file names
   */
  async getMigrationFiles(): Promise<string[]> {
    try {
      const files = await fs.promises.readdir(this.migrationsPath);
      return files
        .filter(file => file.endsWith('.sql'))
        .sort();
    } catch (error) {
      console.error('❌ Failed to read migration files:', error);
      throw error;
    }
  }

  /**
   * Get list of executed migrations from database
   * @returns {Promise<string[]>} Array of executed migration names
   */
  async getExecutedMigrations(): Promise<string[]> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query('SELECT name FROM migrations ORDER BY id');
      return result.rows.map(row => row.name);
    } catch (error) {
      console.error('❌ Failed to get executed migrations:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Calculate checksum for a migration file
   * @param {string} filePath - Path to the migration file
   * @returns {Promise<string>} SHA-256 checksum
   */
  async calculateChecksum(filePath: string): Promise<string> {
    const crypto = await import('crypto');
    const content = await fs.promises.readFile(filePath, 'utf8');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Execute a single migration file
   * @param {string} fileName - Name of the migration file
   * @param {PoolClient} client - Database client
   * @returns {Promise<void>}
   */
  async executeMigration(fileName: string, client: PoolClient): Promise<void> {
    const filePath = path.join(this.migrationsPath, fileName);
    const startTime = Date.now();
    
    try {
      // Read and execute migration
      const sql = await fs.promises.readFile(filePath, 'utf8');
      await client.query(sql);
      
      // Calculate checksum
      const checksum = await this.calculateChecksum(filePath);
      const executionTime = Date.now() - startTime;
      
      // Record migration
      await client.query(
        'INSERT INTO migrations (name, checksum, execution_time_ms) VALUES ($1, $2, $3)',
        [fileName, checksum, executionTime]
      );
      
      console.log(`✅ Executed migration: ${fileName} (${executionTime}ms)`);
    } catch (error) {
      console.error(`❌ Failed to execute migration ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * Rollback a single migration
   * @param {string} fileName - Name of the migration file to rollback
   * @param {PoolClient} client - Database client
   * @returns {Promise<void>}
   */
  async rollbackMigration(fileName: string, client: PoolClient): Promise<void> {
    const rollbackPath = path.join(this.migrationsPath, 'rollbacks', fileName.replace('.sql', '_rollback.sql'));
    const startTime = Date.now();
    
    try {
      // Check if rollback file exists
      if (!fs.existsSync(rollbackPath)) {
        throw new Error(`Rollback file not found: ${rollbackPath}`);
      }
      
      // Read and execute rollback
      const sql = await fs.promises.readFile(rollbackPath, 'utf8');
      await client.query(sql);
      
      // Remove migration record
      await client.query('DELETE FROM migrations WHERE name = $1', [fileName]);
      
      const executionTime = Date.now() - startTime;
      console.log(`✅ Rolled back migration: ${fileName} (${executionTime}ms)`);
    } catch (error) {
      console.error(`❌ Failed to rollback migration ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   * @returns {Promise<void>}
   */
  async migrate(): Promise<void> {
    console.log('🚀 Starting database migration...');
    
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Initialize migration system
      await this.initialize();
      
      // Get migration files and executed migrations
      const migrationFiles = await this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();
      
      // Find pending migrations
      const pendingMigrations = migrationFiles.filter(file => !executedMigrations.includes(file));
      
      if (pendingMigrations.length === 0) {
        console.log('✅ No pending migrations');
        await client.query('COMMIT');
        return;
      }
      
      console.log(`📋 Found ${pendingMigrations.length} pending migrations`);
      
      // Execute pending migrations
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration, client);
      }
      
      await client.query('COMMIT');
      console.log('✅ All migrations completed successfully');
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Rollback the last migration
   * @returns {Promise<void>}
   */
  async rollback(): Promise<void> {
    console.log('🔄 Starting database rollback...');
    
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get the last executed migration
      const result = await client.query(
        'SELECT name FROM migrations ORDER BY id DESC LIMIT 1'
      );
      
      if (result.rows.length === 0) {
        console.log('✅ No migrations to rollback');
        await client.query('COMMIT');
        return;
      }
      
      const lastMigration = result.rows[0].name;
      console.log(`📋 Rolling back migration: ${lastMigration}`);
      
      await this.rollbackMigration(lastMigration, client);
      
      await client.query('COMMIT');
      console.log('✅ Rollback completed successfully');
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Rollback failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Show migration status
   * @returns {Promise<void>}
   */
  async status(): Promise<void> {
    console.log('📊 Migration Status:');
    console.log('===================');
    
    try {
      const migrationFiles = await this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();
      
      for (const file of migrationFiles) {
        const status = executedMigrations.includes(file) ? '✅ EXECUTED' : '⏳ PENDING';
        console.log(`${status} ${file}`);
      }
      
      console.log(`\nTotal: ${migrationFiles.length} migrations`);
      console.log(`Executed: ${executedMigrations.length}`);
      console.log(`Pending: ${migrationFiles.length - executedMigrations.length}`);
      
    } catch (error) {
      console.error('❌ Failed to get migration status:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   * @returns {Promise<void>}
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

/**
 * Main function to handle command line arguments
 */
async function main(): Promise<void> {
  const command = process.argv[2];
  const migrator = new DatabaseMigrator();
  
  try {
    switch (command) {
      case 'migrate':
        await migrator.migrate();
        break;
      case 'rollback':
        await migrator.rollback();
        break;
      case 'status':
        await migrator.status();
        break;
      default:
        console.log('Usage: npm run db:migrate [migrate|rollback|status]');
        console.log('  migrate  - Run all pending migrations');
        console.log('  rollback - Rollback the last migration');
        console.log('  status   - Show migration status');
        process.exit(1);
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await migrator.close();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export default DatabaseMigrator; 