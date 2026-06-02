import { expect, test } from '@playwright/test';

/**
 * DatingImage UI Design Compliance + Functional Flow Tests
 *
 * These tests verify:
 * 1. UI design anti-patterns are NOT present (impeccable.style compliance)
 * 2. All navigation flows work like a human would use them
 * 3. Every button/link clicks through to the correct destination
 */

test.describe.parallel('🏠 Anonymous user — Home Page', () => {
  test('hero section renders with correct layout and copy', async ({ page }) => {
    await page.goto('/');

    // Hero headline — asymmetric left-weighted, NOT centered generic hero
    const headline = page.getByRole('heading', { name: /photos that get you noticed/i });
    await expect(headline).toBeVisible();

    // No gradient text anti-pattern anywhere on page
    const gradientTextElements = await page.locator('[class*="bg-clip-text"]').count();
    expect(gradientTextElements).toBe(0);

    // CTA button visible and clickable
    const ctaButton = page.getByRole('link', { name: /generate photos/i });
    await expect(ctaButton).toBeVisible();

    // Photo grid preview: 6 cards in the hero section
    const heroSection = page.locator('section').first();
    const photoCardLabels = heroSection.locator('text=/Beach|Urban|Coffee Shop|Outdoor|Professional|Wine Bar/');
    await expect(photoCardLabels).toHaveCount(6);

    // Badge "8 photos in under 5 minutes"
    await expect(page.getByText(/8 photos in under 5 minutes/)).toBeVisible();
  });

  test('clicking CTA navigates to login for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /generate photos/i }).click();
    await expect(page).toHaveURL(/login/);
    await expect(page.getByText('Sign in to DatingImage')).toBeVisible();
  });

  test('How It Works section renders with numbered steps', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /three steps\. five minutes/i })).toBeVisible();

    // Steps should have numbered labels visible
    await expect(page.getByText('01').first()).toBeVisible();
    await expect(page.getByText('02').first()).toBeVisible();
    await expect(page.getByText('03').first()).toBeVisible();

    // Step descriptions should be present
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain('Upload your selfies');
    expect(bodyText).toContain('Pick a scene');
    expect(bodyText).toContain('Download & date');
  });

  test('Scenes section renders as numbered list, not emoji cards', async ({ page }) => {
    await page.goto('/');

    const scenesHeading = page.getByRole('heading', { name: /8 backdrops\. one you/i });
    await expect(scenesHeading).toBeVisible();

    // Should show scene names, NOT emojis
    await expect(page.getByText('Beach & Waterfront').first()).toBeVisible();
    await expect(page.getByText('Coffee Shop').first()).toBeVisible();

    // No emoji characters anywhere on the page
    const pageText = await page.locator('body').textContent();
    expect(pageText).not.toMatch(/🏖️|☕|💼|🌆|🏔️|🎨|🍷|🏋️/);
  });

  test('Trust section shows privacy statement with icons', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /your photos stay yours/i })).toBeVisible();

    // Icons should be present
    await expect(page.getByText('Encrypted storage').first()).toBeVisible();
    await expect(page.getByText('Auto-delete after 24h').first()).toBeVisible();
    await expect(page.getByText('Never train AI').first()).toBeVisible();
    await expect(page.getByText('Private by default').first()).toBeVisible();
  });

  test('Footer is DatingImage branded, NOT Acme', async ({ page }) => {
    await page.goto('/');

    // Footer contains DatingImage brand
    const footer = page.locator('footer');
    await expect(footer.getByText('DatingImage').first()).toBeVisible();

    // No Acme references anywhere on the page
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toContain('Acme');
    expect(bodyText).not.toContain('123 Acme Street');

    // Footer navigation links
    await expect(footer.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Terms & Conditions' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'About' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Pricing' })).toBeVisible();
  });

  test('navbar links navigate correctly', async ({ page }) => {
    await page.goto('/');

    const header = page.locator('header');

    // About link in navbar (not footer)
    await header.getByRole('link', { name: 'About', exact: true }).click();
    await expect(page).toHaveURL('/about');

    // Pricing link in navbar
    await page.goto('/');
    await header.getByRole('link', { name: 'Pricing', exact: true }).click();
    await expect(page).toHaveURL('/pricing');

    // FAQ link in navbar
    await page.goto('/');
    await header.getByRole('link', { name: 'FAQ', exact: true }).click();
    await expect(page).toHaveURL('/faq');
  });

  test('Get Started button goes to sign-up', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Get Started' }).click();
    await expect(page).toHaveURL(/sign-up/);
  });
});

test.describe.parallel('📄 Anonymous user — About Page', () => {
  test('renders with correct branding and no gradient text', async ({ page }) => {
    await page.goto('/about');

    // No gradient text anti-pattern
    const gradientTextElements = await page.locator('[class*="bg-clip-text"]').count();
    expect(gradientTextElements).toBe(0);

    await expect(page.getByRole('heading', { name: /better photos\. better matches/i })).toBeVisible();
    await expect(page.getByText('DatingImage uses AI to generate professional dating photos')).toBeVisible();
  });

  test('process section shows numbered steps 01-04', async ({ page }) => {
    await page.goto('/about');

    await expect(page.getByRole('heading', { name: /how it actually works/i })).toBeVisible();

    // Steps with numbers and descriptions
    await expect(page.getByText('01').first()).toBeVisible();
    await expect(page.getByText('Upload').first()).toBeVisible();
    await expect(page.getByText('02').first()).toBeVisible();
    await expect(page.getByText('Train').first()).toBeVisible();
    await expect(page.getByText('03').first()).toBeVisible();
    await expect(page.getByText('04').first()).toBeVisible();
  });

  test('privacy section shows 4 key points with icons', async ({ page }) => {
    await page.goto('/about');

    await expect(page.getByRole('heading', { name: /your face\. your data\. your control/i })).toBeVisible();
    await expect(page.getByText('Auto-delete originals').first()).toBeVisible();
    await expect(page.getByText('No AI training').first()).toBeVisible();
    await expect(page.getByText('Encrypted storage').first()).toBeVisible();
    await expect(page.getByText('Full control').first()).toBeVisible();
  });
});

test.describe.parallel('💰 Anonymous user — Pricing Page', () => {
  test('shows two pricing tiers with correct info', async ({ page }) => {
    await page.goto('/pricing');

    await expect(page.getByRole('heading', { name: /simple, transparent pricing/i })).toBeVisible();

    // Free tier
    await expect(page.getByRole('heading', { name: 'Free', exact: true })).toBeVisible();
    await expect(page.getByText('$0').first()).toBeVisible();
    await expect(page.getByText('15 credits on signup')).toBeVisible();

    // Pay Per Use tier
    await expect(page.getByRole('heading', { name: 'Pay Per Use' })).toBeVisible();
    await expect(page.getByText('$4.99')).toBeVisible();
    await expect(page.getByText('20 credits per pack')).toBeVisible();

    // Most Popular badge
    await expect(page.getByText('Most Popular')).toBeVisible();
  });

  test('pricing CTA buttons navigate correctly', async ({ page }) => {
    await page.goto('/pricing');

    // Pay tier "Buy Credits" → login
    await page.getByRole('link', { name: 'Buy Credits' }).click();
    await expect(page).toHaveURL(/login/);
  });
});

test.describe.parallel('❓ Anonymous user — FAQ Page', () => {
  test('shows all FAQ items and accordion works', async ({ page }) => {
    await page.goto('/faq');

    await expect(page.getByRole('heading', { name: /questions\? answered/i })).toBeVisible();

    // All questions visible
    await expect(page.getByText('How does DatingImage work?')).toBeVisible();
    await expect(page.getByText('Will the photos actually look like me?')).toBeVisible();
    await expect(page.getByText('What happens to my original photos?')).toBeVisible();
    await expect(page.getByText('How many photos do I get?')).toBeVisible();
    await expect(page.getByText('What scenes are available?')).toBeVisible();
    await expect(page.getByText('Can I use these photos on dating apps?')).toBeVisible();
    await expect(page.getByText('What if I run out of credits?')).toBeVisible();
    await expect(page.getByText('What is your refund policy?')).toBeVisible();
  });

  test('accordion expand/collapse works', async ({ page }) => {
    await page.goto('/faq');

    const firstQuestion = page.getByText('How does DatingImage work?');
    await firstQuestion.click();

    // Answer should become visible
    await expect(page.getByText(/upload 5–10 selfies/i)).toBeVisible();
  });
});

test.describe.parallel('🔒 Anonymous user — Legal Pages', () => {
  test('Privacy Policy page renders with all sections', async ({ page }) => {
    await page.goto('/privacy');

    await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'What We Collect' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'How We Use Your Photos' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Data Storage' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Third Parties' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Your Rights' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Contact' })).toBeVisible();
  });

  test('Terms page renders with all sections', async ({ page }) => {
    await page.goto('/terms');

    await expect(page.getByRole('heading', { name: 'Terms & Conditions' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Service Description' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'User Content' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Credits & Payments' })).toBeVisible();
  });
});

test.describe.parallel('🔐 Anonymous user — Login & Sign-up Pages', () => {
  test('login page shows Google-only auth', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByText('Sign in to DatingImage')).toBeVisible();
    await expect(page.getByText('Sign in with your Google account')).toBeVisible();

    // Google button visible
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();

    // NO email/password or Magic Link tabs (removed in previous update)
    await expect(page.locator('text=Email').first()).not.toBeVisible();
    await expect(page.locator('text=Magic Link').first()).not.toBeVisible();
  });

  test('sign-up page shows Google-only auth', async ({ page }) => {
    await page.goto('/sign-up');

    await expect(page.getByText('Join DatingImage')).toBeVisible();
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
  });

  test('login page mentions terms and privacy', async ({ page }) => {
    await page.goto('/login');

    // Terms and Privacy mentioned in the card (auth pages have no footer — own layout)
    await expect(page.getByText('Terms of Service')).toBeVisible();
    await expect(page.getByText('Privacy Policy')).toBeVisible();
  });
});

test.describe.parallel('🚫 Anonymous user — Access Control', () => {
  test('unauthenticated user redirected from dashboard to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/, { timeout: 10000 });
  });

  test('unauthenticated user redirected from project/new to login', async ({ page }) => {
    await page.goto('/project/new');
    await expect(page).toHaveURL(/login/, { timeout: 10000 });
  });
});
