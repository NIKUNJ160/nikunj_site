import { createSession } from '../src/auth';
import * as fs from 'node:fs';
import * as path from 'node:path';

export const TEST_JWT_SECRET = 'default-jwt-secret-key-fallback';

/**
 * Load environment variables from .env.local if present
 */
export function loadEnvLocal(workspaceRoot: string = process.cwd()): Record<string, string> {
  const envPath = path.resolve(workspaceRoot, '.env.local');
  const envVars: Record<string, string> = {};
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        envVars[key] = val;
      }
    }
  }
  return envVars;
}

const localEnv = loadEnvLocal();

export function getTestEnv() {
  return {
    SUPABASE_URL: process.env.SUPABASE_URL || localEnv.SUPABASE_URL || 'https://alzanbffcpiiqyezijaa.supabase.co',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || localEnv.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.mock',
    JWT_SECRET_KEY: process.env.JWT_SECRET_KEY || localEnv.JWT_SECRET_KEY || TEST_JWT_SECRET
  };
}

/**
 * Generate a valid admin session JWT for authenticated route testing
 */
export async function generateTestAdminToken(email: string = 'admin@example.com', secret: string = TEST_JWT_SECRET): Promise<string> {
  return await createSession(email, 'admin', secret);
}

/**
 * Generate a standard user session JWT (non-admin role) for negative access testing
 */
export async function generateTestUserToken(email: string = 'client@example.com', secret: string = TEST_JWT_SECRET): Promise<string> {
  return await createSession(email, 'user', secret);
}

/**
 * Create a Request object for POST /api/analytics/track with JSON payload
 */
export function createTrackJsonRequest(payload: any, headers: Record<string, string> = {}): Request {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return new Request('http://localhost/api/analytics/track', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body
  });
}

/**
 * Create a Request object simulating navigator.sendBeacon (text/plain body)
 */
export function createBeaconRequest(payload: any, headers: Record<string, string> = {}): Request {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return new Request('http://localhost/api/analytics/track', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=UTF-8',
      ...headers
    },
    body
  });
}

/**
 * Create a Request object for GET /admin/analytics or protected routes
 */
export function createAdminRequest(pathName: string = '/admin/analytics', token?: string, headers: Record<string, string> = {}): Request {
  const reqHeaders: Record<string, string> = { ...headers };
  if (token) {
    reqHeaders['Cookie'] = `admin_session=${token}`;
  }
  return new Request(`http://localhost${pathName}`, {
    method: 'GET',
    headers: reqHeaders
  });
}

/**
 * Reads and returns the content of schema.sql
 */
export function readSchemaSql(workspaceRoot: string = process.cwd()): string {
  const schemaPath = path.resolve(workspaceRoot, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    return fs.readFileSync(schemaPath, 'utf8');
  }
  return '';
}

/**
 * Reads public/assets/js/tracker.js if present
 */
export function readTrackerScript(workspaceRoot: string = process.cwd()): string | null {
  const trackerPath = path.resolve(workspaceRoot, 'public', 'assets', 'js', 'tracker.js');
  if (fs.existsSync(trackerPath)) {
    return fs.readFileSync(trackerPath, 'utf8');
  }
  return null;
}
