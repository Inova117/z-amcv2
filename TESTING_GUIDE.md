# ZAMC Testing Guide

## Overview

This guide covers comprehensive testing procedures for the ZAMC platform, including accessibility auditing (WCAG 2.1 AA compliance), responsive design testing, and cross-browser compatibility verification.

## 🔧 Testing Tools & Setup

### Installed Testing Tools

- **@axe-core/react**: Runtime accessibility testing
- **axe-core**: Core accessibility testing engine
- **lighthouse**: Performance and accessibility auditing
- **pa11y**: Command-line accessibility testing

### Configuration Files

- `.pa11yrc.json`: Pa11y accessibility testing configuration
- `lighthouse.config.js`: Lighthouse audit configuration
- `reports/`: Directory for test output files

## 🎯 Accessibility Testing (WCAG 2.1 AA)

### Automated Testing

#### 1. Pa11y Command Line Testing

```bash
# Test single page
npm run test:a11y

# Test all configured URLs
npm run test:a11y-ci

# Custom URL testing
npx pa11y http://localhost:8080/specific-page --standard WCAG2AA
```

#### 2. Lighthouse Accessibility Audit

```bash
# Full accessibility audit
npm run audit:lighthouse

# Combined accessibility and performance audit
npm run audit:a11y
```

#### 3. Runtime Testing with Axe-Core

The application includes runtime accessibility testing through the `AccessibilityAudit` component available at `/testing`.

### Manual Testing Checklist

#### Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical and intuitive
- [ ] Focus indicators are clearly visible
- [ ] No keyboard traps exist
- [ ] Skip links function properly

#### Screen Reader Testing
- [ ] Content is properly announced
- [ ] Headings create logical structure
- [ ] Form labels are associated correctly
- [ ] Error messages are announced
- [ ] Live regions work for dynamic content

#### Color and Contrast
- [ ] Text contrast meets 4.5:1 ratio (AA standard)
- [ ] Large text meets 3:1 ratio
- [ ] Color is not the only means of conveying information
- [ ] Focus indicators have sufficient contrast

#### Images and Media
- [ ] All images have appropriate alt text
- [ ] Decorative images use empty alt attributes
- [ ] Complex images have detailed descriptions
- [ ] Videos have captions when needed

### WCAG 2.1 AA Compliance Areas

#### Perceivable
- **Text Alternatives**: All non-text content has text alternatives
- **Time-based Media**: Captions and alternatives for audio/video
- **Adaptable**: Content can be presented in different ways without losing meaning
- **Distinguishable**: Make it easier for users to see and hear content

#### Operable
- **Keyboard Accessible**: All functionality available from keyboard
- **No Seizures**: Content doesn't cause seizures or physical reactions
- **Navigable**: Help users navigate and find content
- **Input Modalities**: Make it easier for users to operate functionality

#### Understandable
- **Readable**: Make text content readable and understandable
- **Predictable**: Make web pages appear and operate in predictable ways
- **Input Assistance**: Help users avoid and correct mistakes

#### Robust
- **Compatible**: Maximize compatibility with assistive technologies

## 📱 Responsive Design Testing

### Device Testing Matrix

#### Mobile Devices
- **iPhone 14 Pro**: 393x852px, 3x pixel ratio
- **iPhone 14 Pro Max**: 430x932px, 3x pixel ratio
- **Samsung Galaxy S23**: 360x780px, 3x pixel ratio

#### Tablet Devices
- **iPad Air**: 820x1180px, 2x pixel ratio
- **iPad Pro 12.9"**: 1024x1366px, 2x pixel ratio

#### Desktop Resolutions
- **Standard Desktop**: 1920x1080px, 1x pixel ratio
- **Large Desktop**: 2560x1440px, 1x pixel ratio

### Responsive Testing Checklist

#### Layout and Design
- [ ] Content adapts to different screen sizes
- [ ] No horizontal scrolling on mobile
- [ ] Touch targets are minimum 44x44px
- [ ] Text remains readable at all sizes
- [ ] Images scale appropriately

#### Navigation
- [ ] Mobile navigation is accessible
- [ ] Menu items are touch-friendly
- [ ] Navigation collapses appropriately
- [ ] Breadcrumbs work on all devices

#### Forms
- [ ] Form fields are appropriately sized
- [ ] Input types trigger correct keyboards
- [ ] Error messages are visible
- [ ] Submit buttons are accessible

#### Performance
- [ ] Page loads quickly on mobile networks
- [ ] Images are optimized for different densities
- [ ] Critical CSS is inlined
- [ ] JavaScript doesn't block rendering

### Automated Responsive Testing

Use the `ResponsiveTestSuite` component at `/testing` to:
- Test different device viewports
- Verify touch target sizes
- Check for horizontal scrolling
- Validate text readability
- Test interactive element spacing

## 🌐 Cross-Browser Testing

### Supported Browsers

#### Fully Supported
- **Chrome**: 90+
- **Firefox**: 88+
- **Edge**: 90+

#### Mostly Supported
- **Safari**: 14+ (some ES6 features may need polyfills)

### Testing Procedures

#### Manual Testing
1. Test core functionality in each browser
2. Verify CSS compatibility
3. Check JavaScript functionality
4. Test form submissions
5. Verify responsive behavior

#### Automated Testing
Use the `CrossBrowserTestSuite` component for:
- CSS feature support detection
- JavaScript compatibility checks
- Performance comparisons
- Accessibility consistency

### Browser-Specific Considerations

#### Safari
- Some ES6 features may need polyfills
- Different handling of form validation
- Unique CSS rendering behaviors

#### Firefox
- Different font rendering
- Unique developer tools
- Different performance characteristics

#### Edge/Chrome
- Similar Chromium-based behavior
- Good ES6+ support
- Consistent rendering

## 🧪 Component Testing

### Accessible Components

The testing suite includes comprehensive accessible components:

#### Buttons
- `AccessibleButton`: Enhanced button with ARIA support
- `AccessibleSubmitButton`: Form submission with proper labeling
- `AccessibleDeleteButton`: Destructive actions with warnings

#### Forms
- `AccessibleInput`: Input fields with validation and error handling
- `AccessibleTextarea`: Text areas with character counting
- `AccessibleSelect`: Dropdown menus with proper ARIA
- `AccessibleCheckbox`: Checkboxes with descriptions
- `AccessibleRadioGroup`: Radio button groups with proper structure

### Testing Procedures

1. Navigate to `/testing` page
2. Test keyboard navigation through all components
3. Verify screen reader announcements
4. Check visual focus indicators
5. Test error states and validation
6. Verify responsive behavior

## 📊 Performance Testing

### Core Web Vitals

#### Largest Contentful Paint (LCP)
- **Target**: < 2.5 seconds
- **Measurement**: Time to render largest content element

#### First Input Delay (FID)
- **Target**: < 100 milliseconds
- **Measurement**: Time from first interaction to browser response

#### Cumulative Layout Shift (CLS)
- **Target**: < 0.1
- **Measurement**: Visual stability during page load

### Performance Testing Tools

#### Lighthouse
```bash
# Performance audit
lighthouse http://localhost:8080 --only-categories=performance

# Full audit including accessibility
npm run audit:lighthouse
```

#### Web Vitals Monitoring
The application includes real-time performance monitoring through the analytics dashboard.

## 🚀 Continuous Integration Testing

### GitHub Actions Integration

```yaml
name: Accessibility Testing
on: [push, pull_request]
jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build application
        run: npm run build
      - name: Start server
        run: npm run preview &
      - name: Wait for server
        run: npx wait-on http://localhost:4173
      - name: Run accessibility tests
        run: npm run test:a11y-ci
      - name: Run Lighthouse audit
        run: npm run audit:lighthouse
```

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:a11y && npm run type-check"
    }
  }
}
```

## 📋 Testing Checklist

### Before Deployment

#### Accessibility
- [ ] WCAG 2.1 AA compliance verified (95%+ score)
- [ ] Keyboard navigation tested
- [ ] Screen reader compatibility confirmed
- [ ] Color contrast meets standards
- [ ] Focus management implemented

#### Responsive Design
- [ ] Mobile devices tested (iPhone, Android)
- [ ] Tablet devices tested (iPad, Android tablets)
- [ ] Desktop resolutions tested
- [ ] Touch targets meet minimum size requirements
- [ ] No horizontal scrolling on mobile

#### Cross-Browser
- [ ] Chrome functionality verified
- [ ] Firefox compatibility confirmed
- [ ] Safari testing completed
- [ ] Edge compatibility verified

#### Performance
- [ ] Core Web Vitals meet targets
- [ ] Lighthouse score > 90
- [ ] Mobile performance optimized
- [ ] Images optimized for all devices

### Testing Commands Reference

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Accessibility testing
npm run test:a11y
npm run test:a11y-ci

# Performance auditing
npm run audit:lighthouse
npm run audit:a11y

# Type checking
npm run type-check

# Code analysis
npm run analyze
```

## 🔍 Debugging and Troubleshooting

### Common Issues

#### Accessibility
- **Missing ARIA labels**: Use browser dev tools accessibility panel
- **Color contrast failures**: Use contrast checking tools
- **Keyboard navigation issues**: Test with Tab key navigation

#### Responsive Design
- **Layout breaking**: Check CSS Grid/Flexbox implementation
- **Touch targets too small**: Verify minimum 44px size
- **Text too small**: Ensure minimum 16px font size

#### Performance
- **Slow loading**: Check network tab in dev tools
- **Layout shifts**: Identify elements causing CLS
- **JavaScript errors**: Check console for errors

### Useful Browser Extensions

- **axe DevTools**: Accessibility testing
- **WAVE**: Web accessibility evaluation
- **Lighthouse**: Performance and accessibility auditing
- **Responsive Design Mode**: Built-in browser tools

## 📚 Resources

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Web.dev Accessibility](https://web.dev/accessibility/)

### Tools
- [Pa11y](https://pa11y.org/)
- [axe-core](https://github.com/dequelabs/axe-core)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WAVE](https://wave.webaim.org/)

### Testing Services
- [BrowserStack](https://www.browserstack.com/)
- [Sauce Labs](https://saucelabs.com/)
- [CrossBrowserTesting](https://crossbrowsertesting.com/)

---

For questions or issues with testing procedures, please refer to the development team or create an issue in the project repository. 