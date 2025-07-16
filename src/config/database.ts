import { Pool, PoolClient, QueryResult } from 'pg';
import logger from '../utils/logger';
import { DatabaseConfig, DatabaseHealth, QueryOptions, TransactionCallback } from '../types';

/**
 * Database configuration with performance optimizations
 * Includes connection pooling, query optimization, and monitoring
 */
class Database {
  private pool: Pool | null = null;
  private isInitialized: boolean = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize database connection pool with performance optimizations
   * Sets up connection pooling, query monitoring, and health checks
   */
  async initialize(): Promise<void> {
    try {
      // Create connection pool with optimized settings
      this.pool = new Pool({
        host: process.env['DB_HOST'] || 'localhost',
        port: parseInt(process.env['DB_PORT'] || '5432'),
        database: process.env['DB_NAME'] || 'abc_ignite',
        user: process.env['DB_USER'] || 'postgres',
        password: process.env['DB_PASSWORD'] || 'postgres',
        
        // Connection pool settings for maximum performance
        max: parseInt(process.env['DB_POOL_MAX'] || '20'), // Maximum number of clients
        min: parseInt(process.env['DB_POOL_MIN'] || '2'),  // Minimum number of clients
        idle: parseInt(process.env['DB_POOL_IDLE'] || '10000'), // How long a client is allowed to remain idle
        acquire: parseInt(process.env['DB_POOL_ACQUIRE'] || '30000'), // Maximum time to acquire a client
        
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
      } as DatabaseConfig);

      // Set up event listeners for connection monitoring
      this.setupEventListeners();
      
      // Test initial connection
      await this.testConnection();
      
      // Set up health check interval
      this.setupHealthCheck();
      
      this.isInitialized = true;
      logger.info('Database connection pool initialized successfully');
      
    } catch (error) {
      logger.error('Failed to initialize database connection pool', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Set up event listeners for connection pool monitoring
   * Provides insights into connection health and performance
   */
  private setupEventListeners(): void {
    if (!this.pool) return;

    this.pool.on('connect', (client: PoolClient) => {
      logger.debug('New client connected to database');
    });

    this.pool.on('acquire', (client: PoolClient) => {
      logger.debug('Client acquired from pool');
    });

    this.pool.on('release', () => {
      logger.debug('Client released back to pool');
    });

    this.pool.on('error', (err: Error, client: PoolClient) => {
      logger.error('Unexpected error on idle client', { error: err.message });
    });

    this.pool.on('remove', (client: PoolClient) => {
      logger.debug('Client removed from pool');
    });
  }

  /**
   * Test database connection and create indexes if needed
   * Ensures database is ready for production use
   */
  async testConnection(): Promise<boolean> {
    if (!this.pool) throw new Error('Database pool not initialized');

    try {
      const client = await this.pool.connect();
      
      // Test basic connectivity
      const result = await client.query('SELECT NOW() as current_time, version() as db_version');
      logger.info('Database connection test successful', {
        currentTime: result.rows[0].current_time,
        version: result.rows[0].db_version.split(' ')[0]
      });
      
      client.release();
      return true;
      
    } catch (error) {
      logger.error('Database connection test failed', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Set up periodic health checks for database connection
   * Monitors connection health and logs performance metrics
   */
  private setupHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const startTime = Date.now();
        if (!this.pool) return;
        
        const client = await this.pool.connect();
        await client.query('SELECT 1');
        const duration = Date.now() - startTime;
        client.release();
        
        logger.logPerformance('db_health_check', duration, 'ms');
        
      } catch (error) {
        logger.error('Database health check failed', { error: (error as Error).message });
      }
    }, parseInt(process.env['DB_HEALTH_CHECK_INTERVAL'] || '30000')); // 30 seconds
  }

  /**
   * Execute a query with performance monitoring
   * Provides query timing and error handling
   */
  async query(text: string, params: any[] = [], options: QueryOptions = {}): Promise<QueryResult> {
    if (!this.pool) throw new Error('Database pool not initialized');

    const startTime = Date.now();
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(text, params);
      const duration = Date.now() - startTime;
      
      // Log slow queries for performance monitoring
      if (duration > parseInt(process.env['SLOW_QUERY_THRESHOLD'] || '1000')) {
        logger.warn('Slow query detected', {
          query: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
          duration: `${duration}ms`,
          rowCount: result.rowCount,
          params: params.length > 0 ? params : undefined
        });
      }
      
      logger.logPerformance('db_query', duration, 'ms', {
        rowCount: result.rowCount,
        queryType: this.getQueryType(text)
      });
      
      return result;
      
    } catch (error) {
      console.log('Error:\n\n\n\n\n', error);
      const duration = Date.now() - startTime;
      logger.error('Database query failed', {
        error: (error as Error).message,
        query: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
        duration: `${duration}ms`,
        params: params.length > 0 ? params : undefined
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Execute a transaction with automatic rollback on error
   * Provides ACID compliance for complex operations
   */
  async transaction<T>(callback: TransactionCallback<T>): Promise<T> {
    if (!this.pool) throw new Error('Database pool not initialized');

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get query type for performance monitoring
   */
  private getQueryType(query: string): string {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.startsWith('select')) return 'SELECT';
    if (trimmed.startsWith('insert')) return 'INSERT';
    if (trimmed.startsWith('update')) return 'UPDATE';
    if (trimmed.startsWith('delete')) return 'DELETE';
    return 'OTHER';
  }

  /**
   * Perform comprehensive health check
   * Tests connectivity, performance, and connection pool status
   */
  async healthCheck(): Promise<DatabaseHealth> {
    if (!this.pool) throw new Error('Database pool not initialized');

    try {
      const startTime = Date.now();
      const client = await this.pool.connect();
      
      // Test basic connectivity
      await client.query('SELECT 1 as health_check');
      
      // Get connection pool status
      const poolStatus = {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      };
      
      client.release();
      
      const duration = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime: duration,
        poolStats: poolStatus,
        lastCheck: new Date()
      };
      
    } catch (error) {
      logger.error('Database health check failed', { error: (error as Error).message });
      return {
        status: 'unhealthy',
        responseTime: 0,
        poolStats: {
          totalCount: 0,
          idleCount: 0,
          waitingCount: 0
        },
        lastCheck: new Date()
      };
    }
  }

  /**
   * Close database connection pool gracefully
   * Ensures all connections are properly closed
   */
  async close(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isInitialized = false;
      logger.info('Database connection pool closed');
    }
  }

  /**
   * Get connection pool statistics
   * Provides insights into pool performance and usage
   */
  getPoolStats(): { totalCount: number; idleCount: number; waitingCount: number } {
    if (!this.pool) {
      return { totalCount: 0, idleCount: 0, waitingCount: 0 };
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    };
  }

  /**
   * Check if database is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.pool !== null;
  }
}

// Create singleton instance
const database = new Database();

export default database; 