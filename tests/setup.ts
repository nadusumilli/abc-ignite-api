import dotenv from 'dotenv';
import { Pool } from 'pg';
import { beforeAll, afterEach, afterAll } from '@jest/globals';

// Load test environment variables
dotenv.config();

/**
 * Test database configuration with optimized settings for testing
 */
const testDbConfig = {
  host: process.env['DB_HOST'] || 'localhost',
  port: parseInt(process.env['DB_PORT'] || '5432'),
  database: process.env['DB_NAME'] || 'abc_ignite',
  user: process.env['DB_USER'] || 'postgres',
  password: process.env['DB_PASSWORD'] || 'postgres',
  max: 5,
  min: 1,
  idle: 10000,
  acquire: 30000,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 15000,
  query_timeout: 15000,
  statement_timeout: 15000
};

// Global test database pool
let testPool: Pool;

/**
 * Setup test database connection with optimized configuration
 * Provides isolated test environment for reliable testing
 * @returns {Promise<void>}
 */
export async function setupTestDatabase(): Promise<void> {
  try {
    testPool = new Pool(testDbConfig);
    
    // Test connection
    await testPool.query('SELECT 1');
    
    // Set up test database schema
    await setupTestSchema();
    
    console.log('✅ Test database connection established');
  } catch (error) {
    console.warn('⚠️  Test database connection failed, using mock mode:', (error as Error).message);
    // In test environment, we can continue without real database
    testPool = null as any;
  }
}

/**
 * Sets up test database schema from migration files
 * Ensures consistent test environment across all tests
 * @returns {Promise<void>}
 */
async function setupTestSchema(): Promise<void> {
  try {
    if (!testPool) return;
    
    // Read and execute migration file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '../src/database/migrations/001_initial_schema.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.warn('⚠️  Migration file not found, skipping schema setup');
      return;
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map((stmt: string) => stmt.trim())
      .filter((stmt: string) => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        await testPool.query(statement);
      }
    }
    
    console.log('✅ Test database schema setup completed');
  } catch (error) {
    console.warn('⚠️  Failed to setup test database schema:', (error as Error).message);
  }
}

/**
 * Cleans up test data after each test
 * Ensures test isolation and prevents data leakage between tests
 * @returns {Promise<void>}
 */
export async function cleanupTestData(): Promise<void> {
  try {
    if (!testPool) return;
    
    // Delete data in reverse order of dependencies
    await testPool.query('DELETE FROM class_attendance');
    await testPool.query('DELETE FROM bookings');
    await testPool.query('DELETE FROM classes');
    await testPool.query('DELETE FROM members');
    await testPool.query('DELETE FROM instructors');
    
    console.log('✅ Test data cleanup completed');
  } catch (error) {
    console.warn('⚠️  Failed to cleanup test data:', (error as Error).message);
  }
}

/**
 * Clean up test database connection
 * Ensures proper resource cleanup after tests
 * @returns {Promise<void>}
 */
export async function teardownTestDatabase(): Promise<void> {
  try {
    if (testPool) {
      await testPool.end();
      console.log('✅ Test database connection closed');
    }
  } catch (error) {
    console.warn('⚠️  Failed to teardown test database:', (error as Error).message);
  }
}

/**
 * Get test database pool for direct database operations
 * @returns {Pool | null} Test database pool or null if not available
 */
export function getTestPool(): Pool | null {
  return testPool || null;
}

/**
 * Execute a test database query
 * Provides convenient access to test database operations
 * @param {string} text - SQL query text
 * @param {any[]} params - Query parameters
 * @returns {Promise<any>} Query result
 */
export async function executeTestQuery(text: string, params: any[] = []): Promise<any> {
  if (!testPool) {
    throw new Error('Test database not available');
  }
  return await testPool.query(text, params);
}

// Global test setup and teardown
beforeAll(async () => {
  await setupTestDatabase();
});

afterEach(async () => {
  await cleanupTestData();
});

afterAll(async () => {
  await teardownTestDatabase();
});

// Export for use in tests
export { testPool }; 