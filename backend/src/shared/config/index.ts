import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });
dotenv.config();

export interface AppConfig {
  nodeEnv: string;
  port: number;
  baseCurrency: string;
  databaseUrl: string;
  databaseUrlDirect: string;
  dbPoolMax: number;
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenSecret: string;
  refreshTokenExpiresIn: string;
}

export function loadConfig(): AppConfig {
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:6543/postgres?prepare=false';
  const databaseUrlDirect = process.env.DATABASE_URL_DIRECT || 'postgresql://postgres:postgres@127.0.0.1:5432/postgres';

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    baseCurrency: process.env.BASE_CURRENCY || 'INR',
    databaseUrl,
    databaseUrlDirect,
    dbPoolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
    jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_brightloop_min_32_chars_12345',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret_brightloop_min_32_chars_67890',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  };
}

export const CONFIG = loadConfig();
