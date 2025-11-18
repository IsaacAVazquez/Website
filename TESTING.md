# Testing Guide

## Overview

This project uses a comprehensive testing strategy covering unit tests, integration tests, and end-to-end (E2E) tests to ensure code quality and prevent regressions.

## Testing Stack

### Unit & Integration Testing
- **Jest** - Testing framework
- **React Testing Library** - Component testing utilities
- **@testing-library/user-event** - User interaction simulation
- **MSW (Mock Service Worker)** - API mocking
- **@testing-library/jest-dom** - Custom matchers for DOM assertions

### End-to-End Testing
- **Playwright** - E2E testing framework supporting multiple browsers

## Getting Started

### Running Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug

# Run all tests (unit + E2E)
npm run test:all
```

### Coverage Thresholds

The project maintains the following minimum coverage thresholds:
- **Branches:** 70%
- **Functions:** 70%
- **Lines:** 70%
- **Statements:** 70%

Coverage reports are generated in the `coverage/` directory after running `npm run test:coverage`.

## Test Structure

### Unit Tests

Unit tests are located next to the files they test in `__tests__` directories:

```
src/
├── components/
│   └── ui/
│       ├── WarmCard.tsx
│       └── __tests__/
│           └── WarmCard.test.tsx
├── lib/
│   ├── utils.ts
│   └── __tests__/
│       └── utils.test.ts
└── hooks/
    ├── useDebounce.ts
    └── __tests__/
        └── useDebounce.test.ts
```

### E2E Tests

E2E tests are located in the `e2e/` directory:

```
e2e/
├── homepage.spec.ts
├── navigation.spec.ts
├── fantasy-football.spec.ts
└── accessibility.spec.ts
```

## Writing Tests

### Component Tests

Example of testing a React component:

```typescript
import React from 'react'
import { render, screen } from '@testing-library/react'
import { WarmCard } from '../WarmCard'

describe('WarmCard', () => {
  it('renders children correctly', () => {
    render(
      <WarmCard>
        <p>Test content</p>
      </WarmCard>
    )
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <WarmCard className="custom-class">
        <p>Test</p>
      </WarmCard>
    )
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('custom-class')
  })
})
```

### Hook Tests

Example of testing a custom hook:

```typescript
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '../useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    expect(result.current).toBe('initial')

    rerender({ value: 'updated', delay: 500 })
    expect(result.current).toBe('initial')

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(result.current).toBe('updated')
  })
})
```

### Utility Function Tests

Example of testing a utility function:

```typescript
import { cn } from '../utils'

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    const result = cn('class1', 'class2')
    expect(result).toBe('class1 class2')
  })

  it('deduplicates Tailwind classes', () => {
    const result = cn('p-4', 'p-8')
    expect(result).toBe('p-8')
  })
})
```

### E2E Tests

Example of an E2E test:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Isaac Vazquez/)
  })

  test('should have functional navigation', async ({ page }) => {
    await page.goto('/')

    const aboutLink = page.getByRole('link', { name: /about/i })
    await aboutLink.click()

    await expect(page).toHaveURL(/.*about/)
  })
})
```

## Testing Best Practices

### Component Testing

1. **Test User Behavior, Not Implementation**
   - Focus on what users see and do
   - Avoid testing internal state or implementation details

2. **Use Semantic Queries**
   - Prefer `getByRole`, `getByLabelText`, `getByText`
   - Avoid `getByTestId` unless necessary

3. **Test Accessibility**
   - Ensure proper ARIA labels
   - Test keyboard navigation
   - Verify focus management

4. **Mock External Dependencies**
   - Use MSW for API calls
   - Mock third-party libraries when needed
   - Keep mocks simple and focused

### Hook Testing

1. **Use `renderHook` from React Testing Library**
2. **Test edge cases and error conditions**
3. **Use fake timers for debouncing/throttling**
4. **Clean up after tests (timers, subscriptions)**

### E2E Testing

1. **Test Critical User Flows**
   - Homepage load
   - Navigation between pages
   - Core features (Fantasy Football tiers, etc.)

2. **Test on Multiple Browsers**
   - Chromium, Firefox, WebKit
   - Mobile viewports

3. **Keep Tests Independent**
   - Each test should run in isolation
   - Don't rely on test execution order

4. **Use Accessibility Selectors**
   - `getByRole`, `getByLabel`, etc.
   - Helps ensure accessibility compliance

## Mocking

### API Mocking with MSW

MSW (Mock Service Worker) is available for API mocking when needed:

```typescript
// src/test-utils/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/fantasy-football/fantasy-data', () => {
    return HttpResponse.json({
      success: true,
      data: mockPlayerData,
    })
  }),
]
```

MSW is opt-in to avoid polyfill complexity. Import manually in tests that need API mocking:

```typescript
import { server } from '@/test-utils/mocks/server'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### Component Mocking

Mock heavy components or third-party libraries:

```typescript
// Mock next/font/local
jest.mock('next/font/local', () => {
  return jest.fn(() => ({
    className: 'mocked-font-class',
  }))
})

// Mock framer-motion
jest.mock('framer-motion', () => ({
  useReducedMotion: jest.fn(() => false),
}))
```

## Coverage Reports

After running `npm run test:coverage`, open `coverage/lcov-report/index.html` in your browser to view a detailed coverage report.

The report shows:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

Files with low coverage are highlighted, making it easy to identify areas needing more tests.

## Continuous Integration

### GitHub Actions (Recommended)

Add to `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Troubleshooting

### Common Issues

1. **Tests fail with "Cannot find module"**
   - Ensure all dependencies are installed: `npm install`
   - Check that path aliases in `jest.config.js` match `tsconfig.json`

2. **MSW handlers not working**
   - Verify handlers are exported from `src/__tests__/mocks/handlers.ts`
   - Check that the MSW server is started in `jest.setup.js`

3. **E2E tests timeout**
   - Increase timeout in `playwright.config.ts`
   - Ensure dev server is running
   - Check network conditions

4. **Coverage not meeting thresholds**
   - Add more test cases
   - Test edge cases and error conditions
   - Review coverage report to identify gaps

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Contributing

When adding new features:
1. Write tests first (TDD) or alongside implementation
2. Ensure coverage thresholds are met
3. Update this documentation if adding new testing patterns
4. Run `npm run test:all` before submitting PRs

---

**Last Updated:** November 2025
