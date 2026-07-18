export default () => ({
  port: parseInt(process.env.PORT || '3001'),
  environment: process.env.NODE_ENV || 'development',
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    name: process.env.DATABASE_NAME || 'contract_ai',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key',
    expiresIn: process.env.JWT_EXPIRE_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE_IN || '7d',
  },
  ai: {
    apiUrl: process.env.AI_SERVICE_URL || 'http://localhost:5000',
    apiKey: process.env.AI_SERVICE_KEY || 'dev-key',
  },
  ocr: {
    apiUrl: process.env.OCR_SERVICE_URL || 'http://localhost:5001',
    apiKey: process.env.OCR_SERVICE_KEY || 'dev-key',
  },
  storage: {
    s3Bucket: process.env.S3_BUCKET || 'contract-ai',
    s3Region: process.env.S3_REGION || 'us-east-1',
  },
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
  },
});
