declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT?: string;
      DB_HOST?: string;
      DB_PORT?: string;
      DB_NAME?: string;
      DB_USER?: string;
      DB_PASSWORD?: string;
      DB_POOL_MAX?: string;
      DB_POOL_MIN?: string;
      DB_POOL_IDLE?: string;
      DB_POOL_ACQUIRE?: string;
      DB_CONNECTION_TIMEOUT?: string;
      DB_IDLE_TIMEOUT?: string;
      DB_QUERY_TIMEOUT?: string;
      DB_STATEMENT_TIMEOUT?: string;
      DB_HEALTH_CHECK_INTERVAL?: string;
      DB_SSL_CA?: string;
      DB_SSL_CERT?: string;
      DB_SSL_KEY?: string;
      CORS_ORIGIN?: string;
      CORS_CREDENTIALS?: string;
      RATE_LIMIT_WINDOW_MS?: string;
      RATE_LIMIT_MAX_REQUESTS?: string;
      BODY_LIMIT?: string;
      SLOW_QUERY_THRESHOLD?: string;
      ALLOWED_ORIGINS?: string;
    }
  }
}

export {}; 