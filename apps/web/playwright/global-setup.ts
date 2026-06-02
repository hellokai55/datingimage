import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function parseEnvOutput(output: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of output.split('\n')) {
    const match = line.match(/^([A-Z_]+)="(.+)"$/);
    if (match) result[match[1]] = match[2];
  }
  return result;
}

function loadEnvFile(filePath: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!fs.existsSync(filePath)) return result;
  const content = fs.readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

export async function configurePlaywrightEnv() {
  const projectDir = path.resolve(__dirname, '..');
  const envTestPath = path.join(projectDir, '.env.test');
  const envTestLocalPath = path.join(projectDir, '.env.test.local');
  const envProductionLocalPath = path.join(projectDir, '.env.production.local');

  console.log('[global-setup] Project dir:', projectDir);

  if (!fs.existsSync(envTestPath)) {
    throw new Error(`[global-setup] .env.test not found at ${envTestPath}`);
  }

  fs.copyFileSync(envTestPath, envTestLocalPath);
  fs.copyFileSync(envTestPath, envProductionLocalPath);
  console.log('[global-setup] Copied .env.test to .env.test.local and .env.production.local');

  // Load env files into process.env if vars are missing
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const testEnv = loadEnvFile(envTestPath);
    const localEnv = loadEnvFile(path.join(projectDir, '.env.local'));
    Object.assign(process.env, localEnv, testEnv);
  }

  // If env vars are already set (production or CI), use them and skip local Supabase
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    console.log('[global-setup] Using existing Supabase env vars, skipping local Supabase check');
    for (const envPath of [envTestLocalPath, envProductionLocalPath]) {
      let envContent = fs.readFileSync(envPath, 'utf-8');
      envContent = envContent.replace(
        /NEXT_PUBLIC_SUPABASE_URL=.*/,
        `NEXT_PUBLIC_SUPABASE_URL=${process.env.NEXT_PUBLIC_SUPABASE_URL}`
      );
      envContent = envContent.replace(
        /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=.*/,
        `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`
      );
      envContent = envContent.replace(
        /NEXT_PUBLIC_SITE_URL=.*/,
        `NEXT_PUBLIC_SITE_URL=${process.env.PLAYWRIGHT_TEST_BASE_URL ?? 'http://localhost:3000/'}`
      );
      fs.writeFileSync(envPath, envContent);
    }
    return;
  }

  const databaseDir = path.resolve(projectDir, '..', 'database');
  console.log('[global-setup] Running supabase status in:', databaseDir);

  try {
    const statusOutput = execSync('pnpm supabase status --output env', {
      cwd: databaseDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const parsed = parseEnvOutput(statusOutput);
    const publishableKey = parsed.PUBLISHABLE_KEY;
    const apiUrl = parsed.API_URL;

    if (!(publishableKey && apiUrl)) {
      throw new Error('[global-setup] Failed to extract Supabase API URL and publishable key');
    }

    for (const envPath of [envTestLocalPath, envProductionLocalPath]) {
      let envContent = fs.readFileSync(envPath, 'utf-8');
      envContent = envContent.replace(
        /NEXT_PUBLIC_SUPABASE_URL=.*/,
        `NEXT_PUBLIC_SUPABASE_URL=${apiUrl}/`
      );
      envContent = envContent.replace(
        /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=.*/,
        `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${publishableKey}`
      );
      envContent = envContent.replace(
        /NEXT_PUBLIC_SITE_URL=.*/,
        `NEXT_PUBLIC_SITE_URL=${process.env.PLAYWRIGHT_TEST_BASE_URL ?? 'http://localhost:3000/'}`
      );
      fs.writeFileSync(envPath, envContent);
    }
    console.log(
      '[global-setup] Updated .env.test.local and .env.production.local with Supabase settings'
    );
  } catch (error) {
    const err = error as { stderr?: string; stdout?: string; message?: string };
    console.error('[global-setup] Failed to run supabase status');
    if (err.stdout) {
      console.error('[global-setup] stdout:', err.stdout);
    }
    if (err.stderr) {
      console.error('[global-setup] stderr:', err.stderr);
    }
    throw new Error(
      err.message ??
        '[global-setup] Supabase is not running. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, or start Supabase with: cd apps/database && pnpm supabase start'
    );
  }
}

export default configurePlaywrightEnv;

if (require.main === module) {
  void configurePlaywrightEnv().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
