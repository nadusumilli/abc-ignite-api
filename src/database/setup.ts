import { Pool } from 'pg';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
config();

/**
 * Database setup and initialization system
 * Handles database creation, schema setup, and initial data seeding
 */
class DatabaseSetup {
  private pool: Pool;
  private setupPath: string;

  constructor() {
    this.pool = new Pool({
      host: process.env['DB_HOST'] || 'localhost',
      port: parseInt(process.env['DB_PORT'] || '5432'),
      database: process.env['DB_NAME'] || 'abc_ignite',
      user: process.env['DB_USER'] || 'postgres',
      password: process.env['DB_PASSWORD'] || '',

      // Connection pool settings for maximum performance
      max: parseInt(process.env['DB_POOL_MAX'] || '20'), // Maximum number of clients
      min: parseInt(process.env['DB_POOL_MIN'] || '2'),  // Minimum number of clients

      // Connection settings
      connectionTimeoutMillis: parseInt(process.env['DB_CONNECTION_TIMEOUT'] || '10000'),
      idleTimeoutMillis: parseInt(process.env['DB_IDLE_TIMEOUT'] || '30000'),
      query_timeout: parseInt(process.env['DB_QUERY_TIMEOUT'] || '30000'),
      statement_timeout: parseInt(process.env['DB_STATEMENT_TIMEOUT'] || '30000'),

      // SSL configuration for production
      ssl: process.env['NODE_ENV'] === 'production' ? {
        rejectUnauthorized: false,
        ca: process.env['DB_SSL_CA'],
        cert: process.env['DB_SSL_CERT'],
        key: process.env['DB_SSL_KEY']
      } : false,

      // Application name for monitoring
      application_name: 'abc-ignite-api'
    });

    this.setupPath = path.join(__dirname, '..', '..', 'src', 'database');
  }

  /**
   * Test database connection
   * @returns {Promise<boolean>} True if connection successful
   */
  async testConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
  }

  /**
   * Create database if it doesn't exist
   * @returns {Promise<void>}
   */
  async createDatabase(): Promise<void> {
    const dbName = process.env['DB_NAME'] || 'abc_ignite';

    // Connect to default postgres database
    const defaultPool = new Pool({
      host: process.env['DB_HOST'] || 'localhost',
      port: parseInt(process.env['DB_PORT'] || '5432'),
      database: 'postgres',
      user: process.env['DB_USER'] || 'postgres',
      password: process.env['DB_PASSWORD'] || 'postgres'
    });

    try {
      const client = await defaultPool.connect();

      // Check if database exists
      const result = await client.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [dbName]
      );

      if (result.rows.length === 0) {
        console.log(`📋 Creating database: ${dbName}`);
        await client.query(`CREATE DATABASE ${dbName}`);
        console.log(`✅ Database ${dbName} created successfully`);
      } else {
        console.log(`✅ Database ${dbName} already exists`);
      }

      client.release();
    } catch (error) {
      console.error('❌ Failed to create database:', error);
      throw error;
    } finally {
      await defaultPool.end();
    }
  }

  /**
   * Read SQL file content
   * @param {string} filePath - Path to SQL file
   * @returns {Promise<string>} SQL content
   */
  async readSqlFile(filePath: string): Promise<string> {
    try {
      return await fs.promises.readFile(filePath, 'utf8');
    } catch (error) {
      console.error(`❌ Failed to read SQL file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Execute SQL file with transaction safety
   * @param {string} filePath - Path to SQL file
   * @param {string} description - Description for logging
   * @returns {Promise<void>}
   */
  async executeSqlFile(filePath: string, description: string): Promise<void> {
    const client = await this.pool.connect();

    try {
      console.log(`📋 Executing ${description}...`);

      const sql = await this.readSqlFile(filePath);
      const startTime = Date.now();

      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');

      const executionTime = Date.now() - startTime;
      console.log(`✅ ${description} completed (${executionTime}ms)`);

    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Failed to execute ${description}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Setup database schema
   * @returns {Promise<void>}
   */
  async setupSchema(): Promise<void> {
    const schemaPath = path.join(this.setupPath, 'schema.sql');

    if (!fs.existsSync(schemaPath)) {
      console.log('⚠️  Schema file not found, skipping schema setup');
      return;
    }

    await this.executeSqlFile(schemaPath, 'database schema');
  }

  /**
   * Seed initial data
   * @returns {Promise<void>}
   */
  async seedData(): Promise<void> {
    const seedPath = path.join(this.setupPath, 'seed.sql');

    if (!fs.existsSync(seedPath)) {
      console.log('⚠️  Seed file not found, skipping data seeding');
      return;
    }

    await this.executeSqlFile(seedPath, 'initial data seeding');
  }

  /**
   * Create indexes for performance optimization
   * @returns {Promise<void>}
   */
  async createIndexes(): Promise<void> {
    console.log('📋 Creating database indexes...');

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Classes table indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_classes_instructor_id ON classes(instructor_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_classes_class_type ON classes(class_type)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_classes_start_date ON classes(start_date)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_classes_created_at ON classes(created_at)');

      // Full-text search index for classes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_classes_search 
        ON classes USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')))
      `);

      // Bookings table indexes
      await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_class_id ON bookings(class_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at)');

      // Composite indexes for common queries
      await client.query('CREATE INDEX IF NOT EXISTS idx_classes_type_date ON classes(class_type, start_date)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_bookings_class_status ON bookings(class_id, status)');

      await client.query('COMMIT');
      console.log('✅ Database indexes created successfully');

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Failed to create indexes:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Setup database with all components
   * @returns {Promise<void>}
   */
  async setup(): Promise<void> {
    console.log('🚀 Starting database setup...');

    try {
      // Test connection
      const isConnected = await this.testConnection();
      if (!isConnected) {
        throw new Error('Database connection failed');
      }

      // Create database if needed
      await this.createDatabase();

      // Setup schema
      await this.setupSchema();

      // Create indexes
      await this.createIndexes();

      // Seed data
      await this.seedData();

      console.log('✅ Database setup completed successfully');

    } catch (error) {
      console.error('❌ Database setup failed:', error);
      throw error;
    }
  }

  /**
   * Reset database (drop and recreate)
   * @returns {Promise<void>}
   */
  async reset(): Promise<void> {
    console.log('🔄 Starting database reset...');

    const dbName = process.env['DB_NAME'] || 'abc_ignite';

    // Connect to default postgres database
    const defaultPool = new Pool({
      host: process.env['DB_HOST'] || 'localhost',
      port: parseInt(process.env['DB_PORT'] || '5432'),
      database: 'postgres',
      user: process.env['DB_USER'] || 'postgres',
      password: process.env['DB_PASSWORD'] || 'postgres'
    });

    try {
      const client = await defaultPool.connect();

      // Terminate all connections to the database
      await client.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = $1 AND pid <> pg_backend_pid()
      `, [dbName]);

      // Drop database
      console.log(`📋 Dropping database: ${dbName}`);
      await client.query(`DROP DATABASE IF EXISTS ${dbName}`);

      client.release();
      await defaultPool.end();

      // Recreate database
      await this.createDatabase();
      await this.setupSchema();
      await this.createIndexes();
      await this.seedData();

      console.log('✅ Database reset completed successfully');

    } catch (error) {
      console.error('❌ Database reset failed:', error);
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
  const setup = new DatabaseSetup();

  try {
    switch (command) {
      case 'setup':
        await setup.setup();
        break;
      case 'reset':
        await setup.reset();
        break;
      case 'test':
        await setup.testConnection();
        break;
      default:
        console.log('Usage: npm run db:setup [setup|reset|test]');
        console.log('  setup - Setup database schema and seed data');
        console.log('  reset - Reset database (drop and recreate)');
        console.log('  test  - Test database connection');
        process.exit(1);
    }
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  } finally {
    await setup.close();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export default DatabaseSetup;