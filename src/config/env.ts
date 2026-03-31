import { config as loadEnv } from 'dotenv';

loadEnv();

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const defaultDatabaseUrl = `mysql://${requireEnv('MYSQL_USER', 'root')}:${requireEnv('MYSQL_PASSWORD', '123456')}@${requireEnv('MYSQL_HOST', '127.0.0.1')}:${requireEnv('MYSQL_PORT', '3306')}/${requireEnv('MYSQL_DB', 'trackos')}`;

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? defaultDatabaseUrl,
  amapKey: process.env.AMAP_KEY ?? '',
  aiBaseUrl: process.env.AI_BASE_URL ?? '',
  aiApiKey: process.env.AI_API_KEY ?? '',
  aiModel: process.env.AI_MODEL ?? 'gpt-4o-mini',
  aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS ?? 30000),
};
