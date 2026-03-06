# Playwright Selector Strategies

Comprehensive guide to selecting elements reliably with Playwright.

## Selector Hierarchy

Playwright recommends a specific order for selecting elements, prioritizing user-facing attributes:

```
1. getByRole()        ← Most reliable (ARIA roles, semantic HTML)
2. getByLabel()       ← Form inputs with labels
3. getByPlaceholder() ← Input placeholders
4. getByText()        ← Visible text content
5. getByAltText()     ← Images and icons
6. getByTitle()       ← Title attributes
7. getByTestId()      ← Explicit test IDs
8. CSS/XPath          ← Last resort (fragile)
```

## Role-Based Selection

### Common ARIA Roles

**Interactive Elements**:
```typescript
// Buttons
page.getByRole('button', { name: 'Submit' })
page.getByRole('button', { name: /submit|send/i }) // Regex

// Links
page.getByRole('link', { name: 'Learn More' })
page.getByRole('link', { name: 'Documentation' })

// Form Controls
page.getByRole('textbox', { name: 'Email' })
page.getByRole('checkbox', { name: 'Terms' })
page.getByRole('radio', { name: 'Option A' })
page.getByRole('combobox', { name: 'Country' })
page.getByRole('spinbutton', { name: 'Quantity' })
```

**Structural Elements**:
```typescript
// Headings
page.getByRole('heading', { name: 'Welcome' })
page.getByRole('heading', { level: 1 }) // h1 specifically
page.getByRole('heading', { name: 'Section', level: 2 }) // h2 with text

// Lists
page.getByRole('list') // ul or ol
page.getByRole('listitem') // li

// Tables
page.getByRole('table')
page.getByRole('row')
page.getByRole('cell')
page.getByRole('columnheader')

// Navigation
page.getByRole('navigation')
page.getByRole('banner') // header
page.getByRole('contentinfo') // footer
```

### Role Options

```typescript
// Exact name match (default)
page.getByRole('button', { name: 'Submit', exact: true })

// Case-insensitive regex
page.getByRole('button', { name: /submit/i })

// Include hidden elements
page.getByRole('button', { name: 'Submit', includeHidden: true })

// Select by level (headings)
page.getByRole('heading', { level: 2 })

// Select by state
page.getByRole('checkbox', { checked: true })
page.getByRole('button', { pressed: true })
page.getByRole('option', { selected: true })
```

## Text-Based Selection

### getByText Variants

```typescript
// Exact text match
page.getByText('Welcome back')

// Partial text match
page.getByText('Welcome', { exact: false })

// Case-insensitive regex
page.getByText(/welcome back/i)

// Multiple matches
page.getByText('Product').all() // Returns all matches
page.getByText('Product').first() // First match
page.getByText('Product').last() // Last match
page.getByText('Product').nth(2) // Third match (0-indexed)
```

### Substring Matching

```typescript
// Contains text
page.locator('text="Welcome"') // Substring
page.locator('text=/^Welcome/') // Starts with
page.locator('text=/Back$/') // Ends with

// Multiple conditions
page.locator('text=/Welcome.*back/i') // Regex pattern
```

## Form Element Selection

### By Label

```typescript
// Associated label
page.getByLabel('Email address')
page.getByLabel('Password')

// Aria-label attribute
page.getByLabel('Search')

// Aria-labelledby reference
page.getByLabel('User preferences')
```

### By Placeholder

```typescript
page.getByPlaceholder('Enter your email')
page.getByPlaceholder(/search/i)
```

### By Test ID

```typescript
// Default attribute: data-testid
page.getByTestId('submit-button')
page.getByTestId('user-email-input')

// Custom attribute (set in config)
page.getByTestId('login-form') // Uses data-test-id if configured
```

## Filtering Strategies

### Filter by Text

```typescript
// Has specific text
page.getByRole('listitem')
  .filter({ hasText: 'In Stock' })
  .first()

// Does NOT have text
page.getByRole('listitem')
  .filter({ hasNotText: 'Out of Stock' })
  .all()

// Regex filter
page.getByRole('listitem')
  .filter({ hasText: /product \d+/i })
```

### Filter by Child Element

```typescript
// Has specific child
page.getByRole('article')
  .filter({ has: page.getByRole('button', { name: 'Buy' }) })
  .first()

// Does NOT have child
page.getByRole('article')
  .filter({ hasNot: page.locator('.sold-out') })
```

### Filter by Visibility

```typescript
// Only visible elements
page.getByRole('button').filter({ visible: true })

// Include hidden elements
page.getByRole('button').filter({ visible: false })
```

## Chaining Selectors

### DOM Hierarchy Navigation

```typescript
// Parent to child
page.locator('.product-card')
  .locator('.price')

// Multiple levels
page.locator('article')
  .locator('.header')
  .locator('h2')

// Using getBy methods
page.getByRole('article')
  .getByRole('heading')
  .getByText('Product')
```

### Complex Selection

```typescript
// Combine multiple strategies
page.getByRole('listitem')
  .filter({ hasText: 'Available' })
  .locator('.price')
  .first()

// Navigate and filter
page.locator('.product-grid')
  .getByRole('article')
  .filter({ has: page.locator('.discount-badge') })
  .getByRole('button', { name: 'Add to cart' })
```

## CSS Selector Patterns

**Note**: Use only when user-facing selectors aren't viable.

### Basic CSS

```typescript
// By class
page.locator('.product-card')

// By ID
page.locator('#main-content')

// By attribute
page.locator('[data-product-id="123"]')

// By type
page.locator('button')

// Combinators
page.locator('.container > .item') // Direct child
page.locator('.list .item') // Descendant
page.locator('h2 + p') // Adjacent sibling
```

### Advanced CSS

```typescript
// Attribute selectors
page.locator('[href^="https://"]') // Starts with
page.locator('[href$=".pdf"]') // Ends with
page.locator('[class*="product"]') // Contains

// Pseudo-classes
page.locator('li:first-child')
page.locator('tr:nth-child(2)')
page.locator('input:not([disabled])')
page.locator('a:has(img)')

// Multiple selectors
page.locator('.product, .item, .card')
```

## XPath Selectors

**Note**: Avoid when possible. Don't work with Shadow DOM.

```typescript
// Basic XPath
page.locator('xpath=//button[@type="submit"]')
page.locator('xpath=//div[@class="product"]//h2')

// XPath with text
page.locator('xpath=//button[contains(text(), "Submit")]')
page.locator('xpath=//a[text()="Learn More"]')

// XPath predicates
page.locator('xpath=//tr[position()=2]')
page.locator('xpath=//input[@type="email" and @required]')
```

## Shadow DOM Handling

All user-facing selectors pierce shadow roots automatically:

```typescript
// Works with Shadow DOM
page.getByRole('button', { name: 'Submit' })
page.getByText('Welcome')

// XPath does NOT pierce Shadow DOM
// page.locator('xpath=//button') // Won't work with shadow roots
```

## List Handling

### Selecting from Lists

```typescript
// Count items
const count = await page.getByRole('listitem').count()

// Get all items
const items = await page.getByRole('listitem').all()

// Iterate
for (const item of items) {
  const text = await item.textContent()
  console.log(text)
}

// Specific item
page.getByRole('listitem').nth(0) // First (0-indexed)
page.getByRole('listitem').first()
page.getByRole('listitem').last()
```

### Extracting List Data

```typescript
// All text contents
const texts = await page.getByRole('listitem').allTextContents()

// Structured data
const products = await page.locator('.product-card').evaluateAll(
  elements => elements.map(el => ({
    name: el.querySelector('h3')?.textContent,
    price: el.querySelector('.price')?.textContent,
  }))
)
```

## Best Practices

### Selector Stability

**Prefer stable selectors**:
```typescript
// ✅ Good - Based on user-facing attributes
page.getByRole('button', { name: 'Submit' })
page.getByLabel('Email')
page.getByText('Welcome')

// ❌ Bad - Based on implementation details
page.locator('.btn-primary-v2-mobile')
page.locator('div:nth-child(3) > span')
```

### Strictness Mode

Playwright enforces strictness - operations fail if multiple elements match:

```typescript
// ❌ Fails if multiple buttons
await page.getByRole('button').click()

// ✅ Specify which button
await page.getByRole('button', { name: 'Submit' }).click()

// ✅ Or use first/last/nth
await page.getByRole('button').first().click()
```

### Explicit is Better

```typescript
// ❌ Implicit, ambiguous
page.locator('button')

// ✅ Explicit, clear
page.getByRole('button', { name: 'Create Account' })
```

### Testing Selectors

```typescript
// Check if element exists
const exists = await page.getByRole('button', { name: 'Submit' }).count() > 0

// Check visibility
const visible = await page.getByRole('button', { name: 'Submit' }).isVisible()

// Get element info
const text = await page.getByRole('button', { name: 'Submit' }).textContent()
const enabled = await page.getByRole('button', { name: 'Submit' }).isEnabled()
```

## Common Patterns

### Table Data Extraction

```typescript
// Get all rows
const rows = page.locator('table tbody tr')

// Extract structured data
const tableData = await rows.evaluateAll(
  rows => rows.map(row => ({
    col1: row.cells[0]?.textContent?.trim(),
    col2: row.cells[1]?.textContent?.trim(),
    col3: row.cells[2]?.textContent?.trim(),
  }))
)
```

### Card/Grid Selection

```typescript
// Select cards with specific criteria
const availableProducts = page
  .locator('.product-card')
  .filter({ hasNotText: 'Sold Out' })

// Extract from cards
const products = await availableProducts.evaluateAll(
  cards => cards.map(card => ({
    title: card.querySelector('h3')?.textContent,
    price: card.querySelector('.price')?.textContent,
    image: card.querySelector('img')?.src,
  }))
)
```

### Dynamic Content

```typescript
// Wait for element to appear
await page.getByText('Loading...').waitFor({ state: 'hidden' })
await page.getByText('Results').waitFor({ state: 'visible' })

// Wait for count change
await page.getByRole('listitem').count() // Initial count
// ... action that changes list
await expect(page.getByRole('listitem')).toHaveCount(5) // Wait for new count
```

---

Use these selector strategies to build resilient, maintainable automation scripts that mirror how users interact with your application.

