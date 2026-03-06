---
name: testing-with-playwright
description: Test with Playwright for E2E testing, page objects, and assertions. Use for testing user flows, cross-browser testing, and ensuring application reliability.
---

# Testing with Playwright

Modern E2E testing with Playwright for reliable, cross-browser test automation.

## Installation

```bash
npm init playwright@latest
```

This creates:
- `playwright.config.ts` - Configuration
- `tests/` - Test files
- `tests-examples/` - Example tests

## Basic Test

```typescript
// tests/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can sign in', async ({ page }) => {
  // Navigate
  await page.goto('http://localhost:3000');

  // Click sign in
  await page.getByRole('link', { name: 'Sign In' }).click();

  // Fill form
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Password').fill('password123');

  // Submit
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Assert redirect to dashboard
  await expect(page).toHaveURL(/.*dashboard/);

  // Assert user name visible
  await expect(page.getByText('Welcome, Test User')).toBeVisible();
});
```

## Locators

```typescript
// By role (preferred - most accessible)
await page.getByRole('button', { name: 'Submit' });
await page.getByRole('link', { name: 'Home' });
await page.getByRole('heading', { name: 'Welcome' });

// By label
await page.getByLabel('Email address');
await page.getByLabel('Accept terms');

// By placeholder
await page.getByPlaceholder('Enter your email');

// By text
await page.getByText('Welcome to our app');
await page.getByText(/welcome/i); // Case insensitive regex

// By test ID (fallback)
await page.getByTestId('submit-button');

// CSS selectors (avoid if possible)
await page.locator('.btn-primary');

// Chaining
await page.getByRole('navigation').getByRole('link', { name: 'Home' });
```

## Assertions

```typescript
// Visibility
await expect(page.getByText('Success')).toBeVisible();
await expect(page.getByText('Loading')).toBeHidden();

// Text content
await expect(page.getByRole('heading')).toHaveText('Welcome');
await expect(page.getByTestId('count')).toContainText('5');

// Attributes
await expect(page.getByRole('button')).toBeDisabled();
await expect(page.getByRole('button')).toBeEnabled();
await expect(page.getByRole('link')).toHaveAttribute('href', '/about');

// URL
await expect(page).toHaveURL('http://localhost:3000/dashboard');
await expect(page).toHaveURL(/dashboard/);

// Count
await expect(page.getByRole('listitem')).toHaveCount(5);

// Value
await expect(page.getByLabel('Email')).toHaveValue('test@example.com');

// Screenshot comparison
await expect(page).toHaveScreenshot('homepage.png');
```

## User Interactions

```typescript
// Click
await page.getByRole('button', { name: 'Submit' }).click();

// Double click
await page.getByRole('button').dblclick();

// Right click
await page.getByRole('button').click({ button: 'right' });

// Fill input
await page.getByLabel('Email').fill('test@example.com');

// Clear input
await page.getByLabel('Email').clear();

// Type (with delay)
await page.getByLabel('Name').type('John Doe', { delay: 100 });

// Select dropdown
await page.getByLabel('Country').selectOption('USA');

// Check checkbox
await page.getByLabel('Accept terms').check();
await page.getByLabel('Accept terms').uncheck();

// Upload file
await page.getByLabel('Upload').setInputFiles('path/to/file.pdf');

// Hover
await page.getByRole('button').hover();

// Focus
await page.getByLabel('Email').focus();

// Press key
await page.keyboard.press('Enter');
await page.keyboard.press('Control+A');
```

## Page Object Model

```typescript
// tests/pages/login.page.ts
export class LoginPage {
  constructor(private page: Page) {}

  // Locators
  get emailInput() {
    return this.page.getByLabel('Email');
  }

  get passwordInput() {
    return this.page.getByLabel('Password');
  }

  get submitButton() {
    return this.page.getByRole('button', { name: 'Sign In' });
  }

  get errorMessage() {
    return this.page.getByRole('alert');
  }

  // Actions
  async goto() {
    await this.page.goto('/sign-in');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  // Assertions
  async expectLoginSuccess() {
    await expect(this.page).toHaveURL(/.*dashboard/);
  }

  async expectLoginError(message: string) {
    await expect(this.errorMessage).toHaveText(message);
  }
}

// tests/auth.spec.ts
import { LoginPage } from './pages/login.page';

test('login with valid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login('test@example.com', 'password123');
  await loginPage.expectLoginSuccess();
});
```

## Fixtures (Reusable Setup)

```typescript
// tests/fixtures.ts
import { test as base } from '@playwright/test';

type Fixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<Fixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Setup: Login
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/.*dashboard/);

    // Use authenticated page in test
    await use(page);

    // Teardown: Logout
    await page.getByRole('button', { name: 'Logout' }).click();
  },
});

// tests/dashboard.spec.ts
import { test } from './fixtures';

test('user can access dashboard', async ({ authenticatedPage }) => {
  await expect(authenticatedPage.getByRole('heading')).toHaveText('Dashboard');
});
```

## API Testing

```typescript
test('API returns user data', async ({ request }) => {
  const response = await request.get('/api/users/123');

  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(200);

  const user = await response.json();
  expect(user.id).toBe('123');
  expect(user.name).toBe('John Doe');
});

test('API creates user', async ({ request }) => {
  const response = await request.post('/api/users', {
    data: {
      name: 'Jane Doe',
      email: 'jane@example.com',
    },
  });

  expect(response.status()).toBe(201);

  const user = await response.json();
  expect(user.name).toBe('Jane Doe');
});
```

## Waiting & Timeouts

```typescript
// Wait for element
await page.getByText('Success').waitFor();

// Wait for URL
await page.waitForURL('/dashboard');

// Wait for network
await page.waitForResponse(response =>
  response.url().includes('/api/users') && response.status() === 200
);

// Wait for function
await page.waitForFunction(() => window.dataLoaded === true);

// Custom timeout
await page.getByText('Slow content').waitFor({ timeout: 10000 });
```

## Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Running Tests

```bash
# Run all tests
npx playwright test

# Run specific file
npx playwright test auth.spec.ts

# Run in UI mode (recommended for development)
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific browser
npx playwright test --project=chromium

# Debug mode
npx playwright test --debug

# Generate report
npx playwright show-report
```

## Best Practices

1. **Use semantic locators** - getByRole, getByLabel over CSS selectors
2. **Page Object Model** - Encapsulate page logic
3. **Auto-waiting** - Playwright waits automatically for elements
4. **Fixtures for auth** - Reuse authenticated sessions
5. **Test isolation** - Each test independent, can run in parallel
6. **Web-first assertions** - Retry until condition met
7. **Visual testing** - Screenshot comparison for UI changes
8. **CI/CD integration** - Run tests on every commit

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)

