import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const authFile = 'playwright/.auth/user_1.json';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://cdthxyydgpwcpmlyogjg.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_qfIsKDomKcXQrEIcHhihDA_ebI7PFk2';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

// Extract project ref from URL for cookie name
const PROJECT_REF = new URL(SUPABASE_URL).hostname.split('.')[0];
const COOKIE_NAME = `sb-${PROJECT_REF}-auth-token`;

interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
  user: Record<string, unknown>;
}

function toBase64URL(str: string): string {
  return Buffer.from(str).toString('base64url');
}

function encodeSession(session: SupabaseSession): string {
  const json = JSON.stringify(session);
  return `base64-${toBase64URL(json)}`;
}

async function createUserViaAdmin(email: string, password: string): Promise<void> {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not available');
  }

  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
    }),
  });

  // 409 = user already exists, which is fine
  if (!res.ok && res.status !== 409) {
    const body = await res.text().catch(() => 'unknown');
    throw new Error(`Admin create user failed: ${res.status} ${body}`);
  }
}

async function signUp(email: string, password: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  // 409 = user already exists, which is fine for our purposes
  if (!res.ok && res.status !== 409 && res.status !== 422) {
    const body = await res.text().catch(() => 'unknown');
    throw new Error(`Signup failed: ${res.status} ${body}`);
  }
}

async function confirmUser(email: string): Promise<void> {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.log('[user-setup] No service role key, skipping auto-confirmation');
    return;
  }

  // Find user by email
  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!listRes.ok) {
    console.log('[user-setup] Failed to list users:', listRes.status);
    return;
  }

  const { users } = await listRes.json();
  const user = users.find((u: { email: string }) => u.email === email);

  if (!user) {
    console.log('[user-setup] User not found for confirmation');
    return;
  }

  if (user.email_confirmed_at) {
    console.log('[user-setup] User already confirmed');
    return;
  }

  // Confirm user email
  const confirmRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
    method: 'PUT',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email_confirm: true }),
  });

  if (!confirmRes.ok) {
    console.log('[user-setup] Failed to confirm user:', confirmRes.status);
    return;
  }

  console.log('[user-setup] User email confirmed via service role');
}

async function signIn(email: string, password: string): Promise<SupabaseSession> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => 'unknown');
    throw new Error(`Signin failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  return data as SupabaseSession;
}

// Fixed test account — create once manually, then reuse to avoid Supabase rate limits
const TEST_EMAIL = 'e2e-test@example.com';
const TEST_PASSWORD = 'TestPass123!';

setup('create test user', async ({ page, context }) => {
  // Ensure auth directory exists
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Skip if auth state already exists (re-use from previous run)
  if (fs.existsSync(authFile)) {
    console.log('[user-setup] Reusing existing auth state from', authFile);
    return;
  }

  // 1. Create user via admin API (bypasses email validation & rate limits)
  try {
    await createUserViaAdmin(TEST_EMAIL, TEST_PASSWORD);
    console.log('[user-setup] User created via admin API or already exists');
  } catch (err) {
    console.log('[user-setup] Admin create failed, falling back to sign-up:', (err as Error).message);
    // Fallback: try normal sign-up
    try {
      await signUp(TEST_EMAIL, TEST_PASSWORD);
      console.log('[user-setup] Sign up succeeded or user already exists');
    } catch (signupErr) {
      console.log('[user-setup] Sign up warning:', (signupErr as Error).message);
    }
    // Fallback: try to confirm existing user
    try {
      await confirmUser(TEST_EMAIL);
    } catch (confirmErr) {
      console.log('[user-setup] Confirmation warning:', (confirmErr as Error).message);
    }
  }

  // 2. Sign in to get session
  let session: SupabaseSession;
  try {
    session = await signIn(TEST_EMAIL, TEST_PASSWORD);
  } catch (err) {
    console.error('[user-setup] Sign in failed. This usually means the user exists but email is not confirmed.');
    console.error('[user-setup] To enable logged-in tests, either:');
    console.error('  1. Disable email confirmation in Supabase Auth settings, OR');
    console.error('  2. Confirm the user manually in Supabase Dashboard > Authentication > Users, OR');
    console.error('  3. Provide SUPABASE_SERVICE_ROLE_KEY env var for auto-confirmation');
    console.error('[user-setup] Logged-in tests will be skipped. Anon tests will still run.');
    throw new Error(
      'Test user authentication failed. See console output for instructions to enable logged-in tests.'
    );
  }

  // 3. Construct Supabase SSR cookie
  const cookieValue = encodeSession(session);

  // 4. Set cookie on the page context
  await context.addCookies([
    {
      name: COOKIE_NAME,
      value: cookieValue,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      sameSite: 'Lax',
      expires: Math.floor(Date.now() / 1000) + session.expires_in,
    },
  ]);

  // 5. Verify we're logged in by navigating to dashboard
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
  await expect(page.getByRole('heading', { name: 'Your Projects' })).toBeVisible();

  // 6. Save the authentication state
  await context.storageState({ path: authFile });
  console.log('[user-setup] Auth state saved to', authFile);
});
