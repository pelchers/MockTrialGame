---
name: run-full-tests
description: Run complete test suite with coverage and reporting
invocable: true
---

# Run Full Test Suite

Execute the complete test suite including unit, integration, and E2E tests.

## Instructions for Claude

When this command is invoked:

1. **Check test configuration**:
   - Verify test scripts exist in package.json
   - Identify test frameworks in use (Jest, Vitest, Playwright, etc.)
   - Check for test environment setup

2. **Run unit tests**:
   ```bash
   npm test
   # or
   npm run test:unit
   ```

3. **Run integration tests** (if applicable):
   ```bash
   npm run test:integration
   ```

4. **Run E2E tests** (if applicable):
   ```bash
   npm run test:e2e
   # or
   npx playwright test
   ```

5. **Type checking**:
   ```bash
   tsc --noEmit
   # or
   npm run type-check
   ```

6. **Linting**:
   ```bash
   npm run lint
   ```

7. **Report results**:
   - Summarize test results
   - Show any failures with details
   - Display coverage report if available
   - Suggest fixes for failing tests

## Test Execution Order

1. Type checking (fastest, catches type errors)
2. Linting (fast, catches style issues)
3. Unit tests (fast, isolated)
4. Integration tests (medium, with dependencies)
5. E2E tests (slow, full application)

## Example Usage

```
User: /run-full-tests
Claude: Running complete test suite...
```

## Handling Failures

If tests fail:
1. Show detailed error output
2. Identify which test(s) failed
3. Explain likely causes
4. Suggest fixes
5. Offer to fix automatically if straightforward

## Notes

- Run tests before committing significant changes
- E2E tests may require running dev server
- Check test coverage reports for gaps
- Update snapshots if needed: `npm test -- -u`
