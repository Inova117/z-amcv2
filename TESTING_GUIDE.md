# ZAMC E2E Testing Guide

This guide provides comprehensive documentation for the end-to-end testing implementation in the ZAMC (Zero-Ads Marketing Campaign) platform.

## Table of Contents

- [Overview](#overview)
- [Test Coverage](#test-coverage)
- [Setup and Installation](#setup-and-installation)
- [Running Tests](#running-tests)
- [Test Architecture](#test-architecture)
- [Page Object Models](#page-object-models)
- [Test Data Management](#test-data-management)
- [Reporting](#reporting)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)
- [Contributing](#contributing)

## Overview

The ZAMC platform uses a comprehensive e2e testing strategy that covers the complete user journey from sign-up to analytics viewing. Our testing implementation includes:

- **Playwright** for cross-browser testing with advanced features
- **Cypress** for fast, reliable e2e testing with excellent debugging
- **Accessibility testing** with pa11y and axe-core
- **Performance testing** with Lighthouse
- **Visual regression testing** capabilities
- **Comprehensive reporting** with HTML, JSON, and JUnit formats

### Test Frameworks

| Framework | Purpose | Strengths |
|-----------|---------|-----------|
| Playwright | Cross-browser testing, API testing | Multi-browser support, parallel execution, network interception |
| Cypress | Fast e2e testing, debugging | Excellent DX, time-travel debugging, real-time reloads |
| pa11y | Accessibility testing | WCAG compliance, automated a11y checks |
| Lighthouse | Performance testing | Core Web Vitals, performance metrics |

## Test Coverage

### Complete User Journey

Our tests cover the entire user workflow:

1. **Authentication** - Sign up, sign in, password reset, social auth
2. **Platform Connection** - OAuth flows, connection management, error handling
3. **Asset Management** - File uploads, organization, optimization
4. **Campaign Creation** - Form validation, audience targeting, budget setup
5. **Campaign Deployment** - Deployment process, status monitoring
6. **Analytics** - Data visualization, filtering, export functionality

### Error States and Edge Cases

- Form validation errors
- Network failures and timeouts
- Platform connection failures
- File upload errors
- Deployment failures
- Data loading failures
- Concurrent operations
- Browser compatibility issues

### Empty States

- New user onboarding
- No platforms connected
- No assets uploaded
- No campaigns created
- No analytics data

### Accessibility

- Keyboard navigation
- Screen reader support
- WCAG 2.1 AA compliance
- Color contrast
- Focus management
- ARIA labels and descriptions

### Performance

- Page load times
- Core Web Vitals
- Large dataset handling
- Image optimization
- Bundle size analysis

## Setup and Installation

### Prerequisites

- Node.js 18+ and npm
- Modern browser (Chrome, Firefox, Safari, Edge)
- Git

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Playwright browsers:**
   ```bash
   npx playwright install
   ```

3. **Verify installation:**
   ```bash
   npm run test:e2e -- --help
   ```

### Environment Setup

Create a `.env.test` file for test-specific configuration:

```env
# Test Environment Configuration
BASE_URL=http://localhost:3000
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!

# API Configuration
API_BASE_URL=http://localhost:8080
GRAPHQL_ENDPOINT=http://localhost:8080/graphql

# Platform Test Credentials (for integration tests)
GOOGLE_ADS_TEST_ACCOUNT_ID=123-456-7890
META_TEST_ACCOUNT_ID=act_987654321

# Test Data
ENABLE_TEST_DATA_GENERATION=true
CLEANUP_TEST_DATA=true
```

## Running Tests

### Quick Start

```bash
# Run all tests with default settings
npm run test:e2e

# Run only Playwright tests
npm run test:e2e:playwright

# Run only Cypress tests
npm run test:e2e:cypress

# Run tests in headed mode (visible browser)
npm run test:e2e:headed

# Run tests in parallel
npm run test:e2e:parallel
```

### Advanced Usage

Use the comprehensive test runner script:

```bash
# Run all tests with accessibility and performance checks
./scripts/run-e2e-tests.sh -a -P

# Run Playwright tests in headed mode with specific browser
./scripts/run-e2e-tests.sh -f playwright -h -b firefox

# Run Cypress tests in parallel
./scripts/run-e2e-tests.sh -f cypress -p

# Run in CI mode
./scripts/run-e2e-tests.sh -C

# Generate reports only (from existing test results)
./scripts/run-e2e-tests.sh -r

# Clean reports and run fresh tests
./scripts/run-e2e-tests.sh -c
```

### Test Runner Options

| Option | Description | Example |
|--------|-------------|---------|
| `-f, --framework` | Test framework (playwright\|cypress\|both) | `-f playwright` |
| `-b, --browser` | Browser (chromium\|firefox\|webkit\|chrome\|edge) | `-b firefox` |
| `-h, --headed` | Run in headed mode | `-h` |
| `-p, --parallel` | Run tests in parallel | `-p` |
| `-a, --accessibility` | Run accessibility tests | `-a` |
| `-P, --performance` | Run performance tests | `-P` |
| `-r, --report-only` | Generate reports only | `-r` |
| `-c, --clean` | Clean existing reports | `-c` |
| `-C, --ci` | CI mode | `-C` |
| `-v, --verbose` | Verbose output | `-v` |

## Test Architecture

### Directory Structure

```
tests/
├── e2e/
│   ├── playwright/
│   │   ├── pages/           # Page Object Models
│   │   │   ├── BasePage.ts
│   │   │   ├── AuthPage.ts
│   │   │   ├── PlatformConnectionPage.ts
│   │   │   ├── CampaignBuilderPage.ts
│   │   │   ├── AssetManagerPage.ts
│   │   │   └── AnalyticsPage.ts
│   │   ├── specs/           # Test specifications
│   │   │   ├── auth.spec.ts
│   │   │   └── complete-user-journey.spec.ts
│   │   ├── global-setup.ts  # Global test setup
│   │   └── global-teardown.ts
│   └── cypress/
│       ├── fixtures/        # Test data
│       │   ├── user.json
│       │   ├── analytics.json
│       │   └── platforms-status.json
│       ├── specs/           # Test specifications
│       │   └── complete-user-journey.cy.ts
│       └── support/         # Custom commands and utilities
│           ├── commands.ts
│           └── e2e.ts
├── playwright.config.ts     # Playwright configuration
├── cypress.config.ts        # Cypress configuration
└── tsconfig.test.json       # TypeScript config for tests
```

### Configuration Files

#### Playwright Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e/playwright',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'reports/playwright-report' }],
    ['json', { outputFile: 'reports/playwright-results.json' }],
    ['junit', { outputFile: 'reports/playwright-results.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
});
```

#### Cypress Configuration

```typescript
// cypress.config.ts
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'tests/e2e/cypress/support/e2e.ts',
    specPattern: 'tests/e2e/cypress/specs/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    retries: { runMode: 2, openMode: 0 }
  }
});
```

## Page Object Models

### BasePage

The `BasePage` class provides common functionality for all page objects:

```typescript
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Navigation methods
  async goto(path: string = '/') {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  // Element interactions
  async clickElement(selector: string) {
    await this.page.click(selector);
  }

  async fillInput(selector: string, value: string) {
    await this.page.fill(selector, value);
  }

  // Assertions
  async expectElementToBeVisible(selector: string) {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  // API mocking
  async mockApiCall(url: string, response: any, status: number = 200) {
    await this.page.route(`**/${url}`, route => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }
}
```

### Specialized Page Objects

Each page object extends `BasePage` and provides specific functionality:

- **AuthPage** - Authentication flows, form validation, social auth
- **PlatformConnectionPage** - OAuth flows, connection management
- **CampaignBuilderPage** - Campaign creation, form handling, validation
- **AssetManagerPage** - File uploads, asset organization, search/filter
- **AnalyticsPage** - Data visualization, filtering, export

### Usage Example

```typescript
test('should create a complete campaign', async ({ page }) => {
  const authPage = new AuthPage(page);
  const campaignPage = new CampaignBuilderPage(page);

  // Sign up
  await authPage.goToSignUp();
  await authPage.signUpWithValidData();

  // Create campaign
  await campaignPage.goToCampaignBuilder();
  const campaignData = await campaignPage.createCompleteCampaign();
  await campaignPage.expectCampaignCreated();
});
```

## Test Data Management

### Fixtures

Test data is organized in JSON fixtures:

```json
// tests/e2e/cypress/fixtures/user.json
{
  "id": "user-123",
  "email": "test@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "subscription": {
    "plan": "pro",
    "status": "active"
  }
}
```

### Dynamic Data Generation

```typescript
// Generate unique test data
const userData = {
  email: `test+${Date.now()}@example.com`,
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User'
};
```

### Data Cleanup

Tests automatically clean up created data:

```typescript
test.afterEach(async ({ page }) => {
  // Clean up test data
  await cleanupTestCampaigns();
  await cleanupTestAssets();
});
```

## Reporting

### HTML Reports

Interactive HTML reports with:
- Test results overview
- Screenshots and videos
- Error details and stack traces
- Performance metrics
- Accessibility violations

### JSON Reports

Machine-readable reports for CI/CD integration:

```json
{
  "stats": {
    "suites": 5,
    "tests": 25,
    "passes": 23,
    "failures": 2,
    "duration": 120000
  },
  "tests": [
    {
      "title": "should complete user journey",
      "state": "passed",
      "duration": 15000,
      "screenshots": ["screenshot1.png"]
    }
  ]
}
```

### JUnit Reports

XML reports for CI/CD systems:

```xml
<testsuites>
  <testsuite name="Authentication" tests="5" failures="0" time="30.5">
    <testcase name="should sign up successfully" time="6.2"/>
    <testcase name="should sign in successfully" time="4.8"/>
  </testsuite>
</testsuites>
```

### Accessibility Reports

Detailed accessibility violation reports:

```json
{
  "url": "http://localhost:3000/dashboard",
  "issues": [
    {
      "code": "color-contrast",
      "type": "error",
      "message": "Element has insufficient color contrast",
      "selector": ".btn-primary",
      "context": "<button class=\"btn-primary\">Submit</button>"
    }
  ]
}
```

### Performance Reports

Lighthouse performance metrics:

```json
{
  "lhr": {
    "finalUrl": "http://localhost:3000/",
    "audits": {
      "first-contentful-paint": {
        "score": 0.95,
        "displayValue": "1.2 s"
      },
      "largest-contentful-paint": {
        "score": 0.89,
        "displayValue": "2.1 s"
      }
    }
  }
}
```

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Start application
        run: |
          npm run build
          npm run preview &
          sleep 10
      
      - name: Run E2E tests
        run: ./scripts/run-e2e-tests.sh -C -a -P
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: reports/
```

### Docker Integration

```dockerfile
# Dockerfile.e2e
FROM mcr.microsoft.com/playwright:v1.40.0-focal

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx playwright install

CMD ["./scripts/run-e2e-tests.sh", "-C"]
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    
    stages {
        stage('Setup') {
            steps {
                sh 'npm ci'
                sh 'npx playwright install'
            }
        }
        
        stage('E2E Tests') {
            steps {
                sh './scripts/run-e2e-tests.sh -C -a -P'
            }
            post {
                always {
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'reports',
                        reportFiles: 'test-summary.html',
                        reportName: 'E2E Test Report'
                    ])
                    
                    junit 'reports/**/*.xml'
                }
            }
        }
    }
}
```

## Troubleshooting

### Common Issues

#### Tests Timing Out

```bash
# Increase timeout in playwright.config.ts
timeout: 60000,
expect: { timeout: 10000 }

# Or use environment variable
PLAYWRIGHT_TIMEOUT=60000 npm run test:e2e
```

#### Browser Launch Failures

```bash
# Install system dependencies
npx playwright install-deps

# Use different browser
npm run test:e2e -- --project=firefox
```

#### Application Not Starting

```bash
# Check if port is available
lsof -i :3000

# Start application manually
npm run dev &
sleep 10
npm run test:e2e
```

#### Flaky Tests

```bash
# Run with retries
npm run test:e2e -- --retries=3

# Run specific test
npm run test:e2e -- --grep "user journey"
```

### Debug Mode

```bash
# Playwright debug mode
npm run test:e2e:debug

# Cypress debug mode
npm run test:e2e:cypress -- --headed --no-exit
```

### Verbose Logging

```bash
# Enable verbose logging
DEBUG=pw:api npm run test:e2e

# Cypress verbose mode
npm run test:e2e:cypress -- --verbose
```

## Best Practices

### Test Organization

1. **Use descriptive test names** that explain the expected behavior
2. **Group related tests** in describe blocks
3. **Keep tests independent** - each test should be able to run in isolation
4. **Use proper setup and teardown** to maintain clean state

### Page Object Design

1. **Single responsibility** - each page object should represent one page/component
2. **Encapsulate selectors** - keep selectors within page objects
3. **Return meaningful values** - methods should return useful data for assertions
4. **Use async/await** consistently for better readability

### Data Management

1. **Use unique test data** to avoid conflicts
2. **Clean up after tests** to prevent data pollution
3. **Mock external dependencies** when possible
4. **Use fixtures for static data** and generators for dynamic data

### Error Handling

1. **Test error states explicitly** - don't just test happy paths
2. **Use appropriate timeouts** for different operations
3. **Provide meaningful error messages** in custom assertions
4. **Handle network failures gracefully**

### Performance

1. **Run tests in parallel** when possible
2. **Use efficient selectors** - prefer data-testid over complex CSS selectors
3. **Minimize test data** - use only what's necessary for the test
4. **Optimize test setup** - share expensive operations across tests

## Contributing

### Adding New Tests

1. **Identify the user story** you want to test
2. **Choose the appropriate framework** (Playwright for complex scenarios, Cypress for fast feedback)
3. **Create or extend page objects** as needed
4. **Write the test following our patterns**
5. **Add appropriate assertions and error handling**
6. **Update documentation** if adding new patterns

### Test Review Checklist

- [ ] Test has a clear, descriptive name
- [ ] Test is independent and can run in isolation
- [ ] Appropriate page objects are used
- [ ] Error states are tested
- [ ] Test data is properly managed
- [ ] Assertions are meaningful and specific
- [ ] Documentation is updated if needed

### Code Style

Follow the existing patterns:

```typescript
// Good
test('should create campaign with valid data', async ({ page }) => {
  const campaignPage = new CampaignBuilderPage(page);
  
  await campaignPage.goToCampaignBuilder();
  const campaignData = await campaignPage.createCompleteCampaign();
  
  await campaignPage.expectCampaignCreated();
  await campaignPage.expectElementToContainText('[data-testid="campaign-name"]', campaignData.name);
});

// Avoid
test('campaign test', async ({ page }) => {
  await page.goto('/campaigns/create');
  await page.fill('#name', 'Test Campaign');
  await page.click('button');
  // ... more direct page interactions
});
```

### Submitting Changes

1. **Create a feature branch** from develop
2. **Write tests** for new functionality
3. **Ensure all tests pass** locally
4. **Update documentation** as needed
5. **Submit a pull request** with clear description
6. **Address review feedback** promptly

---

For more information, see:
- [Playwright Documentation](https://playwright.dev/)
- [Cypress Documentation](https://docs.cypress.io/)
- [pa11y Documentation](https://pa11y.org/)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)

## Support

If you encounter issues or have questions:

1. Check this guide and the troubleshooting section
2. Search existing issues in the repository
3. Create a new issue with detailed information
4. Contact the development team

Happy testing! 🚀 