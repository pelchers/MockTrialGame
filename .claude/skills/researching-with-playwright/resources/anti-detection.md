# Anti-Detection Techniques for Playwright

Strategies for making Playwright automation less detectable and bypassing common anti-bot measures.

## Detection Methods

Websites detect bots through:
1. **Browser fingerprinting** - Checking navigator properties
2. **Behavioral patterns** - Analyzing interaction speed/patterns
3. **Automation indicators** - Detecting WebDriver, headless mode
4. **Network patterns** - Unusual request patterns
5. **Challenge-response** - CAPTCHAs, proof-of-work

## Stealth Configuration

### Basic Stealth Setup

```typescript
import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: false, // Use headed mode (more realistic)
  args: [
    '--disable-blink-features=AutomationControlled', // Remove automation flag
  ],
});

const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  viewport: { width: 1920, height: 1080 },
  locale: 'en-US',
  timezoneId: 'America/New_York',
});

const page = await context.newPage();
```

### Remove WebDriver Detection

```typescript
await page.addInitScript(() => {
  // Remove navigator.webdriver flag
  Object.defineProperty(navigator, 'webdriver', {
    get: () => false,
  });

  // Mock plugins
  Object.defineProperty(navigator, 'plugins', {
    get: () => [1, 2, 3, 4, 5],
  });

  // Mock languages
  Object.defineProperty(navigator, 'languages', {
    get: () => ['en-US', 'en'],
  });

  // Mock permissions
  const originalQuery = window.navigator.permissions.query;
  window.navigator.permissions.query = (parameters) =>
    parameters.name === 'notifications'
      ? Promise.resolve({ state: Notification.permission })
      : originalQuery(parameters);
});
```

## Human-Like Behavior

### Random Delays

```typescript
// Random delay between actions
async function randomDelay(min = 100, max = 500) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise(resolve => setTimeout(resolve, delay));
}

// Use between actions
await page.getByRole('button', { name: 'Submit' }).click();
await randomDelay(200, 400);
await page.getByLabel('Email').fill('user@example.com');
```

### Mouse Movement

```typescript
// Gradual mouse movement
async function moveMouseGradually(page, x, y, steps = 10) {
  const current = await page.mouse.position;
  const deltaX = (x - current.x) / steps;
  const deltaY = (y - current.y) / steps;

  for (let i = 0; i < steps; i++) {
    await page.mouse.move(
      current.x + deltaX * i,
      current.y + deltaY * i
    );
    await randomDelay(10, 30);
  }
}

// Hover before clicking
const button = page.getByRole('button', { name: 'Submit' });
const box = await button.boundingBox();
if (box) {
  await moveMouseGradually(page, box.x + box.width / 2, box.y + box.height / 2);
  await randomDelay(100, 200);
  await button.click();
}
```

### Realistic Typing

```typescript
async function typeWithTypos(page, locator, text) {
  const element = page.locator(locator);

  for (const char of text) {
    // Occasional typos
    if (Math.random() < 0.05) {
      const typo = String.fromCharCode(char.charCodeAt(0) + 1);
      await element.type(typo, { delay: Math.random() * 100 + 50 });
      await randomDelay(100, 300);
      await page.keyboard.press('Backspace');
      await randomDelay(50, 150);
    }

    await element.type(char, { delay: Math.random() * 100 + 50 });
  }
}
```

### Scrolling Patterns

```typescript
// Human-like scrolling
async function scrollGradually(page, targetY, speed = 100) {
  await page.evaluate(async (target, scrollSpeed) => {
    const distance = target - window.scrollY;
    const duration = Math.abs(distance) / scrollSpeed;
    const start = window.scrollY;
    const startTime = Date.now();

    function easeInOutQuad(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function scroll() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutQuad(progress);

      window.scrollTo(0, start + distance * eased);

      if (progress < 1) {
        requestAnimationFrame(scroll);
      }
    }

    scroll();
  }, targetY, speed);
}

// Random scroll before interacting
await scrollGradually(page, Math.random() * 500);
await randomDelay(500, 1000);
```

## Request Handling

### Realistic Headers

```typescript
const context = await browser.newContext({
  extraHTTPHeaders: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  },
});
```

### Request Timing

```typescript
// Add jitter to request timing
await page.route('**/*', async (route) => {
  await randomDelay(10, 50); // Small random delay
  await route.continue();
});
```

### Cookie Management

```typescript
// Load and save cookies
const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf8'));
await context.addCookies(cookies);

// Save cookies for next session
const savedCookies = await context.cookies();
fs.writeFileSync('cookies.json', JSON.stringify(savedCookies, null, 2));
```

## Session Management

### Persistent Context

```typescript
// Use persistent browser context (keeps cookies, localStorage)
const context = await chromium.launchPersistentContext('./user-data', {
  headless: false,
  userAgent: 'Mozilla/5.0...',
});
```

### Fingerprint Consistency

```typescript
// Keep consistent fingerprint across sessions
const fingerprint = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
  viewport: { width: 1920, height: 1080 },
  locale: 'en-US',
  timezoneId: 'America/New_York',
  geolocation: { longitude: -122.4194, latitude: 37.7749 },
  permissions: ['geolocation'],
};

const context = await browser.newContext(fingerprint);
```

## Rate Limiting

### Request Throttling

```typescript
class RateLimiter {
  constructor(requestsPerSecond) {
    this.interval = 1000 / requestsPerSecond;
    this.lastRequest = 0;
  }

  async wait() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;

    if (timeSinceLastRequest < this.interval) {
      await new Promise(resolve =>
        setTimeout(resolve, this.interval - timeSinceLastRequest)
      );
    }

    this.lastRequest = Date.now();
  }
}

const limiter = new RateLimiter(2); // 2 requests per second

for (const url of urls) {
  await limiter.wait();
  await page.goto(url);
  // ... scrape
}
```

### Exponential Backoff

```typescript
async function withRetry(fn, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      console.log(`Retry ${attempt + 1} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Proxy Rotation

### Single Proxy

```typescript
const browser = await chromium.launch({
  proxy: {
    server: 'http://proxy.example.com:8080',
    username: 'user',
    password: 'pass',
  },
});
```

### Rotating Proxies

```typescript
const proxies = [
  { server: 'http://proxy1.com:8080', username: 'user', password: 'pass' },
  { server: 'http://proxy2.com:8080', username: 'user', password: 'pass' },
  { server: 'http://proxy3.com:8080', username: 'user', password: 'pass' },
];

async function scrapeWithProxyRotation(urls) {
  for (let i = 0; i < urls.length; i++) {
    const proxy = proxies[i % proxies.length];

    const browser = await chromium.launch({ proxy });
    const page = await browser.newPage();

    await page.goto(urls[i]);
    // ... scrape

    await browser.close();
  }
}
```

## CAPTCHA Handling

### Detecting CAPTCHAs

```typescript
async function hasCaptcha(page) {
  // Check for common CAPTCHA elements
  const captchaSelectors = [
    'iframe[src*="recaptcha"]',
    'iframe[src*="hcaptcha"]',
    '.g-recaptcha',
    '#captcha',
  ];

  for (const selector of captchaSelectors) {
    if (await page.locator(selector).count() > 0) {
      return true;
    }
  }

  return false;
}

// Usage
if (await hasCaptcha(page)) {
  console.log('CAPTCHA detected, waiting for manual solve...');
  await page.pause(); // Manual intervention
}
```

### CAPTCHA Services

```typescript
// Example: 2Captcha integration (pseudocode)
async function solveCaptcha(page, apiKey) {
  const siteKey = await page.locator('[data-sitekey]').getAttribute('data-sitekey');
  const pageUrl = page.url();

  // Submit to solving service
  const taskId = await submit2Captcha(apiKey, siteKey, pageUrl);

  // Poll for solution
  const solution = await poll2CaptchaSolution(taskId);

  // Inject solution
  await page.evaluate((token) => {
    document.getElementById('g-recaptcha-response').value = token;
  }, solution);

  await page.getByRole('button', { name: 'Submit' }).click();
}
```

## Browser Fingerprint Evasion

### Canvas Fingerprinting

```typescript
await page.addInitScript(() => {
  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = function(type) {
    const context = this.getContext('2d');
    if (context) {
      // Add slight noise to canvas
      const imageData = context.getImageData(0, 0, this.width, this.height);
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] += Math.floor(Math.random() * 2);
      }
      context.putImageData(imageData, 0, 0);
    }
    return originalToDataURL.call(this, type);
  };
});
```

### WebGL Fingerprinting

```typescript
await page.addInitScript(() => {
  const getParameter = WebGLRenderingContext.prototype.getParameter;
  WebGLRenderingContext.prototype.getParameter = function(parameter) {
    // Randomize vendor/renderer
    if (parameter === 37445) { // UNMASKED_VENDOR_WEBGL
      return 'Intel Inc.';
    }
    if (parameter === 37446) { // UNMASKED_RENDERER_WEBGL
      return 'Intel Iris OpenGL Engine';
    }
    return getParameter.call(this, parameter);
  };
});
```

## Best Practices

### Do's

1. **Use headless: false** for critical scraping
2. **Implement random delays** between actions
3. **Rotate user agents and proxies**
4. **Respect robots.txt** and rate limits
5. **Save and reuse sessions** (cookies, localStorage)
6. **Monitor for detection** (CAPTCHAs, blocks)
7. **Add error handling** for rate limits

### Don'ts

1. **Don't scrape too fast** - Causes immediate blocking
2. **Don't ignore errors** - May indicate detection
3. **Don't use default settings** - Easily detected
4. **Don't scrape during peak hours** - Higher chance of detection
5. **Don't bypass CAPTCHAs illegally** - Legal/ethical issues

### Legal Considerations

Always:
- Review site's Terms of Service
- Check robots.txt
- Respect copyright and data privacy laws
- Consider API alternatives
- Implement proper attribution

---

Use these techniques responsibly and ethically. Prioritize using official APIs when available.

