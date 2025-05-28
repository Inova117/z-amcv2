# ZAMC Manual Test Matrix - Hero Flows

## 📋 Overview

This document provides a comprehensive manual testing matrix for the ZAMC (Zero-Effort AI Marketing Campaigns) platform's critical hero flows. The matrix includes detailed test cases for core user journeys, accessibility compliance, and mobile responsiveness.

## 🎯 Hero Flow Definitions

### Primary Hero Flows
1. **User Onboarding Flow** - Account setup → Platform connections → Campaign brief
2. **Campaign Creation Flow** - Campaign builder → Asset management → Deployment
3. **Hero Demo Flow** - Interactive demonstration of platform capabilities
4. **Analytics & Monitoring Flow** - Performance tracking → Optimization insights
5. **Asset Management Flow** - Upload → Approval → Optimization

### Secondary Hero Flows
6. **Authentication Flow** - Login → Password reset → Security settings
7. **Settings & Profile Flow** - Profile management → Notifications → Platform connections
8. **Real-time Collaboration Flow** - Chat → Notifications → Live updates

---

## 🧪 Manual Test Matrix

### Test Environment Setup
- **Devices**: Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)
- **Browsers**: Chrome, Firefox, Safari, Edge
- **Accessibility Tools**: Screen reader (NVDA/JAWS), Keyboard-only navigation
- **Network Conditions**: Fast 3G, Slow 3G, Offline

---

## 🎓 Hero Flow 1: User Onboarding Flow

### Flow Overview
**Journey**: Landing → Registration → Account Info → Platform Connections → Campaign Brief → Dashboard

### Test Scenarios

#### HF1-001: Complete Onboarding Success Path
**Priority**: Critical | **Type**: Functional
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Navigate to platform | Landing page loads with CTA | ⬜ | |
| 2 | Click "Get Started" | Registration form appears | ⬜ | |
| 3 | Complete registration | Email verification sent | ⬜ | |
| 4 | Verify email | Redirected to account info step | ⬜ | |
| 5 | Fill account information | Progress bar at 33% | ⬜ | |
| 6 | Click "Next" | Platform connection step loads | ⬜ | |
| 7 | Select Google Ads | OAuth simulation initiated | ⬜ | |
| 8 | Complete OAuth | Connection status "Connected" | ⬜ | |
| 9 | Click "Next" | Campaign brief step loads | ⬜ | |
| 10 | Fill campaign brief | All required fields completed | ⬜ | |
| 11 | Click "Complete Setup" | Dashboard loads with welcome message | ⬜ | |

#### HF1-002: Step Validation & Error Handling
**Priority**: High | **Type**: Functional
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Skip required fields in Step 1 | Error message displays | ⬜ | |
| 2 | Try to proceed without completion | "Next" button disabled/error shown | ⬜ | |
| 3 | Enter invalid email format | Real-time validation error | ⬜ | |
| 4 | Try platform connection failure | Retry option available | ⬜ | |
| 5 | Navigate back and forth | Data preserved between steps | ⬜ | |

#### HF1-003: Onboarding Accessibility Check
**Priority**: High | **Type**: Accessibility | **Regression**: Yes
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Navigate using Tab key only | All interactive elements focusable | ⬜ | |
| 2 | Use screen reader | All content readable with proper labels | ⬜ | |
| 3 | Check form labels | All inputs have associated labels | ⬜ | |
| 4 | Verify color contrast | Text contrast ratio ≥ 4.5:1 | ⬜ | |
| 5 | Test with high contrast mode | Interface remains usable | ⬜ | |
| 6 | Check focus indicators | Clear focus rings on all elements | ⬜ | |

#### HF1-004: Onboarding Mobile Responsiveness
**Priority**: High | **Type**: Mobile | **Regression**: Yes
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Load on mobile device (375px) | Layout adapts properly | ⬜ | |
| 2 | Check touch targets | All buttons ≥ 44px touch area | ⬜ | |
| 3 | Test portrait/landscape | Content reflows correctly | ⬜ | |
| 4 | Verify text readability | Font size ≥ 16px, no horizontal scroll | ⬜ | |
| 5 | Test form interactions | Virtual keyboard doesn't obstruct | ⬜ | |
| 6 | Check progress indicator | Visible and accurately positioned | ⬜ | |

---

## 🎯 Hero Flow 2: Campaign Creation Flow

### Flow Overview
**Journey**: Dashboard → Campaign Builder → Targeting Setup → Budget Configuration → Asset Assignment → Review → Deployment

### Test Scenarios

#### HF2-001: End-to-End Campaign Creation
**Priority**: Critical | **Type**: Functional
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Click "Create Campaign" | Campaign builder loads | ⬜ | |
| 2 | Enter campaign name/description | Auto-save indicator appears | ⬜ | |
| 3 | Select campaign objective | Relevant options populate | ⬜ | |
| 4 | Configure targeting options | Audience size estimate updates | ⬜ | |
| 5 | Set budget and schedule | Budget validation passes | ⬜ | |
| 6 | Select platforms | Platform-specific options appear | ⬜ | |
| 7 | Assign creative assets | Asset thumbnails load correctly | ⬜ | |
| 8 | Review campaign summary | All details correctly displayed | ⬜ | |
| 9 | Click "Deploy Campaign" | Deployment process initiates | ⬜ | |
| 10 | Monitor deployment status | Real-time status updates | ⬜ | |

#### HF2-002: Campaign Builder Form Validation
**Priority**: High | **Type**: Functional
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Submit with empty required fields | Specific field errors shown | ⬜ | |
| 2 | Enter invalid budget amount | Number validation error | ⬜ | |
| 3 | Set end date before start date | Date logic validation error | ⬜ | |
| 4 | Select incompatible platforms | Warning message displays | ⬜ | |
| 5 | Exceed character limits | Character count with limit warning | ⬜ | |

#### HF2-003: Campaign Builder Accessibility
**Priority**: High | **Type**: Accessibility | **Regression**: Yes
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Navigate form with keyboard | Logical tab order maintained | ⬜ | |
| 2 | Use screen reader on form | Form structure clearly announced | ⬜ | |
| 3 | Check error announcements | Errors announced to screen reader | ⬜ | |
| 4 | Verify ARIA labels | All complex controls have ARIA | ⬜ | |
| 5 | Test with reduced motion | Animations respect prefers-reduced-motion | ⬜ | |

#### HF2-004: Campaign Builder Mobile Experience
**Priority**: High | **Type**: Mobile | **Regression**: Yes
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Open builder on mobile | Multi-step layout adapts | ⬜ | |
| 2 | Test form input interactions | No zoom on input focus | ⬜ | |
| 3 | Check date/time pickers | Mobile-optimized controls | ⬜ | |
| 4 | Test file upload interface | Mobile upload options available | ⬜ | |
| 5 | Verify sticky navigation | Step navigation remains accessible | ⬜ | |

---

## ✨ Hero Flow 3: Hero Demo Flow

### Flow Overview
**Journey**: Demo Trigger → Step-by-Step Demonstration → Campaign Creation → Asset Upload → Approval → Deployment → Analytics

### Test Scenarios

#### HF3-001: Complete Demo Experience
**Priority**: Critical | **Type**: Functional
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Click "Start Demo" | Demo overlay/modal appears | ⬜ | |
| 2 | Observe AI campaign generation | Loading states and progress shown | ⬜ | |
| 3 | Watch asset creation simulation | Realistic asset thumbnails appear | ⬜ | |
| 4 | View approval process | Status changes from pending→approved | ⬜ | |
| 5 | Monitor deployment simulation | Platform connections simulate | ⬜ | |
| 6 | See live analytics generation | Charts populate with demo data | ⬜ | |
| 7 | Navigate between demo steps | Clear progress indicators | ⬜ | |
| 8 | Complete demo flow | CTA to create real campaign | ⬜ | |

#### HF3-002: Demo Interaction Controls
**Priority**: Medium | **Type**: Functional
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Pause demo mid-flow | Demo pauses at current step | ⬜ | |
| 2 | Skip to specific step | Navigation works correctly | ⬜ | |
| 3 | Restart demo | Demo resets to beginning | ⬜ | |
| 4 | Exit demo early | Returns to previous state | ⬜ | |

#### HF3-003: Demo Accessibility
**Priority**: Medium | **Type**: Accessibility | **Regression**: Yes
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Navigate demo with keyboard | All controls keyboard accessible | ⬜ | |
| 2 | Use screen reader | Demo steps clearly announced | ⬜ | |
| 3 | Check animation descriptions | Alt text for visual demonstrations | ⬜ | |
| 4 | Test pause/play controls | Controls properly labeled | ⬜ | |

#### HF3-004: Demo Mobile Experience
**Priority**: Medium | **Type**: Mobile | **Regression**: Yes
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Start demo on mobile | Demo adapts to mobile layout | ⬜ | |
| 2 | Check demo controls | Touch-friendly control sizes | ⬜ | |
| 3 | Test video/animation playback | Optimized for mobile performance | ⬜ | |
| 4 | Verify text readability | Demo text legible on mobile | ⬜ | |

---

## 📊 Hero Flow 4: Analytics & Monitoring Flow

### Flow Overview
**Journey**: Dashboard → Analytics Page → Filter/Search → Data Visualization → Export → Insights

### Test Scenarios

#### HF4-001: Analytics Dashboard Navigation
**Priority**: Critical | **Type**: Functional
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Navigate to Analytics | Page loads with default view | ⬜ | |
| 2 | Check data loading states | Skeleton loaders while loading | ⬜ | |
| 3 | Verify chart interactions | Hover states and tooltips work | ⬜ | |
| 4 | Apply date range filters | Charts update with filtered data | ⬜ | |
| 5 | Test export functionality | Data exports in expected format | ⬜ | |

#### HF4-002: Analytics Accessibility
**Priority**: High | **Type**: Accessibility | **Regression**: Yes
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Navigate charts with keyboard | Chart elements keyboard accessible | ⬜ | |
| 2 | Use screen reader on data | Data tables have proper headers | ⬜ | |
| 3 | Check chart descriptions | Charts have text alternatives | ⬜ | |
| 4 | Test filter controls | All filters keyboard accessible | ⬜ | |

#### HF4-003: Analytics Mobile Responsiveness
**Priority**: High | **Type**: Mobile | **Regression**: Yes
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | View analytics on mobile | Charts resize appropriately | ⬜ | |
| 2 | Test chart interactions | Touch gestures work properly | ⬜ | |
| 3 | Check data table scrolling | Horizontal scroll for wide tables | ⬜ | |
| 4 | Verify filter interface | Mobile-optimized filter controls | ⬜ | |

---

## 📁 Hero Flow 5: Asset Management Flow

### Flow Overview
**Journey**: Asset Library → Upload → Processing → Approval → Organization → Optimization

### Test Scenarios

#### HF5-001: Asset Upload & Management
**Priority**: Critical | **Type**: Functional
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Access asset library | Library loads with existing assets | ⬜ | |
| 2 | Upload single file | Upload progress and success | ⬜ | |
| 3 | Upload multiple files | Batch upload with individual progress | ⬜ | |
| 4 | Test file validation | Appropriate error for invalid files | ⬜ | |
| 5 | Organize with tags/folders | Assets organize correctly | ⬜ | |
| 6 | Preview asset details | Modal/panel shows full info | ⬜ | |
| 7 | Approve/reject assets | Status updates reflect changes | ⬜ | |

#### HF5-002: Asset Management Accessibility
**Priority**: High | **Type**: Accessibility | **Regression**: Yes
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Navigate library with keyboard | Grid navigation works properly | ⬜ | |
| 2 | Use screen reader | Asset descriptions properly read | ⬜ | |
| 3 | Check upload controls | File input properly labeled | ⬜ | |
| 4 | Test drag-and-drop | Alternative upload method available | ⬜ | |

#### HF5-003: Asset Management Mobile
**Priority**: High | **Type**: Mobile | **Regression**: Yes
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Browse assets on mobile | Grid adapts to mobile screen | ⬜ | |
| 2 | Test mobile upload | Camera/gallery integration works | ⬜ | |
| 3 | Check asset previews | Previews work on mobile browsers | ⬜ | |
| 4 | Verify touch interactions | Long press, swipe gestures work | ⬜ | |

---

## 🔐 Supporting Flow Tests

### Authentication Flow Tests
#### AF-001: Login/Logout Accessibility
**Priority**: High | **Type**: Accessibility | **Regression**: Yes
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Navigate login with keyboard | All fields and buttons accessible | ⬜ | |
| 2 | Test screen reader | Form properly announced | ⬜ | |
| 3 | Check error announcements | Login errors read aloud | ⬜ | |

#### AF-002: Login Mobile Experience
**Priority**: High | **Type**: Mobile | **Regression**: Yes
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Login on mobile device | Form optimized for mobile | ⬜ | |
| 2 | Test password field | Show/hide password works | ⬜ | |
| 3 | Check autofill | Browser autofill works correctly | ⬜ | |

### Real-time Features Tests
#### RT-001: Notifications Accessibility
**Priority**: Medium | **Type**: Accessibility | **Regression**: Yes
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | Receive notification | Screen reader announces new notification | ⬜ | |
| 2 | Navigate notification center | Keyboard navigation works | ⬜ | |
| 3 | Manage notifications | Actions properly labeled | ⬜ | |

#### RT-002: Notifications Mobile
**Priority**: Medium | **Type**: Mobile | **Regression**: Yes
| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| 1 | View notifications on mobile | Panel adapts to mobile | ⬜ | |
| 2 | Test swipe actions | Swipe to dismiss/archive works | ⬜ | |

---

## 🔍 Cross-Platform Regression Checks

### Critical Accessibility Regression Tests
**Run before each release**

#### CART-001: Keyboard Navigation Regression
| Hero Flow | Test Focus | Pass/Fail | Notes |
|-----------|------------|-----------|-------|
| Onboarding | Tab order and focus management | ⬜ | |
| Campaign Builder | Form navigation and submission | ⬜ | |
| Asset Manager | Grid navigation and actions | ⬜ | |
| Analytics | Chart and filter navigation | ⬜ | |

#### CART-002: Screen Reader Regression
| Hero Flow | Test Focus | Pass/Fail | Notes |
|-----------|------------|-----------|-------|
| Onboarding | Step announcements and form labels | ⬜ | |
| Campaign Builder | Complex form structure reading | ⬜ | |
| Asset Manager | Asset descriptions and actions | ⬜ | |
| Analytics | Data table and chart descriptions | ⬜ | |

#### CART-003: Color Contrast Regression
| Hero Flow | Test Focus | Pass/Fail | Notes |
|-----------|------------|-----------|-------|
| All Flows | Text contrast ≥ 4.5:1 | ⬜ | |
| All Flows | Interactive element contrast ≥ 3:1 | ⬜ | |
| All Flows | Focus indicator contrast ≥ 3:1 | ⬜ | |

### Critical Mobile Regression Tests
**Run before each release**

#### CMRT-001: Core Mobile Functionality
| Hero Flow | Test Focus | Pass/Fail | Notes |
|-----------|------------|-----------|-------|
| Onboarding | Multi-step mobile flow | ⬜ | |
| Campaign Builder | Complex form on mobile | ⬜ | |
| Asset Manager | Upload and file management | ⬜ | |
| Analytics | Chart interactions on touch | ⬜ | |

#### CMRT-002: Mobile Performance
| Hero Flow | Test Focus | Pass/Fail | Notes |
|-----------|------------|-----------|-------|
| All Flows | Page load time < 3s on 3G | ⬜ | |
| All Flows | Smooth 60fps interactions | ⬜ | |
| All Flows | Proper image loading/optimization | ⬜ | |

---

## 📝 Test Execution Guidelines

### Pre-Test Setup
1. Clear browser cache and cookies
2. Disable browser extensions (except accessibility tools)
3. Set up test data in clean environment
4. Verify network conditions
5. Prepare accessibility testing tools

### During Testing
1. **Document everything**: Screenshot bugs, note edge cases
2. **Test realistically**: Use actual user behavior patterns
3. **Cross-reference**: Compare with automated test results
4. **Validate fixes**: Re-test after bug fixes

### Post-Test Actions
1. **Consolidate results**: Update pass/fail status
2. **File bug reports**: Include reproduction steps
3. **Update documentation**: Note any test changes needed
4. **Plan regression**: Schedule regression test cycles

---

## 🚨 Bug Reporting Template

### Bug Report Format
```
**Bug ID**: [Unique identifier]
**Hero Flow**: [Flow name and step]
**Priority**: [Critical/High/Medium/Low]
**Type**: [Functional/Accessibility/Mobile/Performance]
**Browser/Device**: [Specific environment]

**Summary**: [Brief description]

**Reproduction Steps**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result**: [What should happen]
**Actual Result**: [What actually happens]
**Screenshots/Video**: [Attach evidence]

**Accessibility Impact**: [If applicable]
**Mobile Impact**: [If applicable]
**Workaround**: [If available]
```

---

## 📊 Test Metrics & Reporting

### Success Criteria
- **Hero Flow Coverage**: 100% of critical paths tested
- **Accessibility Compliance**: WCAG 2.1 AA standard met
- **Mobile Responsiveness**: All flows work on target devices
- **Cross-browser Compatibility**: 95%+ functionality across browsers
- **Regression Detection**: Critical regressions caught before release

### Reporting Schedule
- **Daily**: Update test execution status
- **Weekly**: Comprehensive test results review
- **Pre-release**: Full regression test completion
- **Post-release**: Validation testing and metrics review

---

## 🔄 Test Maintenance

### Regular Review Schedule
- **Monthly**: Review and update test cases
- **Quarterly**: Assess test coverage and add new scenarios  
- **After major releases**: Update all test documentation
- **Annually**: Complete test strategy review

### Continuous Improvement
- Monitor test effectiveness and adjust scenarios
- Gather feedback from development team
- Update based on user behavior analytics
- Incorporate new accessibility and mobile standards

---

*This document is maintained by the QA team and updated regularly. For questions or suggestions, contact: qa-team@zamc-platform.com* 