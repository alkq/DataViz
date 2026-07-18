export const config = {
  databaseUrl: process.env.DATABASE_URL || 'postgresql://dataviz:dataviz_secure_password@localhost:5432/dataviz',
  dbPoolMax: parseInt(process.env.DB_POOL_MAX || '50', 10),
  dbIdleTimeoutMs: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  dbConnectionTimeoutMs: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000', 10),
  dbStatementTimeoutMs: parseInt(process.env.DB_STATEMENT_TIMEOUT || '10000', 10),
  
  clickhouseUrl: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
  clickhouseUser: process.env.CLICKHOUSE_USER || 'dataviz',
  clickhousePassword: process.env.CLICKHOUSE_PASSWORD || 'dataviz_secure_password',
  clickhouseDb: process.env.CLICKHOUSE_DB || 'industrial_analytics',
  
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  
  keycloakUrl: process.env.KEYCLOAK_URL || 'http://localhost:8080',
  keycloakRealm: process.env.KEYCLOAK_REALM || 'dataviz',
  keycloakClientId: process.env.KEYCLOAK_CLIENT_ID || 'dataviz-api',
  
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
};