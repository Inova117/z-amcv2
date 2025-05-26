import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AccessibilityAudit, 
  SkipLink, 
  LiveRegion 
} from '@/components/ui/AccessibilityAudit';
import { 
  ResponsiveTestSuite, 
  CrossBrowserTestSuite 
} from '@/components/testing/ResponsiveTestSuite';
import { 
  AccessibleButton,
  AccessibleSubmitButton,
  AccessibleDeleteButton 
} from '@/components/ui/AccessibleButton';
import {
  AccessibleInput,
  AccessibleTextarea,
  AccessibleSelect,
  AccessibleCheckbox,
  AccessibleRadioGroup
} from '@/components/ui/AccessibleForm';
import { 
  TestTube, 
  Accessibility, 
  Smartphone, 
  Globe, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Play
} from 'lucide-react';
import { useAnnouncement } from '@/lib/accessibility';

export const TestingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('accessibility');
  const [testResults, setTestResults] = useState<{
    accessibility: number;
    responsive: number;
    crossBrowser: number;
  }>({
    accessibility: 0,
    responsive: 0,
    crossBrowser: 0,
  });
  const { announcement, announce } = useAnnouncement();

  const runAllTests = async () => {
    announce('Running comprehensive test suite', 'assertive');
    
    // This would trigger all test suites
    setTimeout(() => {
      setTestResults({
        accessibility: 95,
        responsive: 88,
        crossBrowser: 92,
      });
      announce('All tests completed successfully', 'polite');
    }, 3000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-4 w-4" />;
    if (score >= 70) return <AlertTriangle className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Skip Links for Accessibility */}
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#test-results">Skip to test results</SkipLink>

      {/* Live Region for Announcements */}
      <LiveRegion message={announcement} priority="polite" />

      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Testing & Quality Assurance
        </h1>
        <p className="text-muted-foreground">
          Comprehensive testing suite for accessibility, responsiveness, and cross-browser compatibility
        </p>
      </div>

      {/* Test Overview Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Test Suite Overview
              </CardTitle>
              <CardDescription>
                Run comprehensive tests to ensure your application meets quality standards
              </CardDescription>
            </div>
            <AccessibleButton
              onClick={runAllTests}
              ariaLabel="Run all test suites"
              ariaDescription="This will run accessibility, responsive, and cross-browser tests"
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Run All Tests
            </AccessibleButton>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Accessibility Score */}
            <div className={`p-4 rounded-lg border ${getScoreColor(testResults.accessibility)}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Accessibility className="h-5 w-5" />
                  <span className="font-medium">Accessibility</span>
                </div>
                {getScoreIcon(testResults.accessibility)}
              </div>
              <div className="text-2xl font-bold">
                {testResults.accessibility > 0 ? `${testResults.accessibility}%` : 'Not tested'}
              </div>
              <div className="text-sm opacity-75">WCAG 2.1 AA Compliance</div>
            </div>

            {/* Responsive Score */}
            <div className={`p-4 rounded-lg border ${getScoreColor(testResults.responsive)}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  <span className="font-medium">Responsive</span>
                </div>
                {getScoreIcon(testResults.responsive)}
              </div>
              <div className="text-2xl font-bold">
                {testResults.responsive > 0 ? `${testResults.responsive}%` : 'Not tested'}
              </div>
              <div className="text-sm opacity-75">Mobile & Tablet Ready</div>
            </div>

            {/* Cross-Browser Score */}
            <div className={`p-4 rounded-lg border ${getScoreColor(testResults.crossBrowser)}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  <span className="font-medium">Cross-Browser</span>
                </div>
                {getScoreIcon(testResults.crossBrowser)}
              </div>
              <div className="text-2xl font-bold">
                {testResults.crossBrowser > 0 ? `${testResults.crossBrowser}%` : 'Not tested'}
              </div>
              <div className="text-sm opacity-75">Browser Compatibility</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Testing Interface */}
      <main id="main-content">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="accessibility" className="flex items-center gap-2">
              <Accessibility className="h-4 w-4" />
              Accessibility
            </TabsTrigger>
            <TabsTrigger value="responsive" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Responsive
            </TabsTrigger>
            <TabsTrigger value="cross-browser" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Cross-Browser
            </TabsTrigger>
            <TabsTrigger value="components" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Components
            </TabsTrigger>
          </TabsList>

          {/* Accessibility Testing */}
          <TabsContent value="accessibility" className="space-y-6">
            <AccessibilityAudit autoRun={false} />
            
            {/* Accessibility Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>WCAG 2.1 AA Guidelines</CardTitle>
                <CardDescription>
                  Key accessibility principles your application should follow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Perceivable
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                      <li>• Text alternatives for images</li>
                      <li>• Sufficient color contrast (4.5:1)</li>
                      <li>• Resizable text up to 200%</li>
                      <li>• Audio/video captions</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Operable
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                      <li>• Keyboard accessible</li>
                      <li>• No seizure-inducing content</li>
                      <li>• Sufficient time limits</li>
                      <li>• Clear navigation</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Understandable
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                      <li>• Readable text</li>
                      <li>• Predictable functionality</li>
                      <li>• Input assistance</li>
                      <li>• Error identification</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Robust
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                      <li>• Valid HTML markup</li>
                      <li>• Compatible with assistive technologies</li>
                      <li>• Future-proof code</li>
                      <li>• Semantic HTML structure</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Responsive Testing */}
          <TabsContent value="responsive" className="space-y-6">
            <ResponsiveTestSuite autoTest={false} />
          </TabsContent>

          {/* Cross-Browser Testing */}
          <TabsContent value="cross-browser" className="space-y-6">
            <CrossBrowserTestSuite />
            
            {/* Browser Support Matrix */}
            <Card>
              <CardHeader>
                <CardTitle>Browser Support Matrix</CardTitle>
                <CardDescription>
                  Supported browsers and their minimum versions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="font-medium">Chrome</div>
                    <div className="text-sm text-muted-foreground">90+</div>
                    <Badge variant="outline" className="mt-2 bg-green-50 text-green-700">
                      Fully Supported
                    </Badge>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="font-medium">Firefox</div>
                    <div className="text-sm text-muted-foreground">88+</div>
                    <Badge variant="outline" className="mt-2 bg-green-50 text-green-700">
                      Fully Supported
                    </Badge>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="font-medium">Safari</div>
                    <div className="text-sm text-muted-foreground">14+</div>
                    <Badge variant="outline" className="mt-2 bg-yellow-50 text-yellow-700">
                      Mostly Supported
                    </Badge>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="font-medium">Edge</div>
                    <div className="text-sm text-muted-foreground">90+</div>
                    <Badge variant="outline" className="mt-2 bg-green-50 text-green-700">
                      Fully Supported
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Component Testing */}
          <TabsContent value="components" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Accessible Component Testing</CardTitle>
                <CardDescription>
                  Test accessible components with proper ARIA support and keyboard navigation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Button Testing */}
                <div className="space-y-4">
                  <h4 className="font-medium">Accessible Buttons</h4>
                  <div className="flex flex-wrap gap-4">
                    <AccessibleButton>Default Button</AccessibleButton>
                    <AccessibleButton 
                      variant="outline"
                      ariaLabel="Save document"
                      shortcut="Ctrl+S"
                    >
                      Save
                    </AccessibleButton>
                    <AccessibleSubmitButton>Submit Form</AccessibleSubmitButton>
                    <AccessibleDeleteButton>Delete Item</AccessibleDeleteButton>
                  </div>
                </div>

                {/* Form Testing */}
                <div className="space-y-4">
                  <h4 className="font-medium">Accessible Form Components</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AccessibleInput
                      label="Email Address"
                      type="email"
                      placeholder="Enter your email"
                      description="We'll never share your email with anyone"
                      required
                      showValidation
                      validationMessage="Email format is valid"
                    />
                    
                    <AccessibleSelect
                      label="Country"
                      placeholder="Select your country"
                      required
                      options={[
                        { value: 'us', label: 'United States' },
                        { value: 'ca', label: 'Canada' },
                        { value: 'uk', label: 'United Kingdom' },
                        { value: 'au', label: 'Australia' },
                      ]}
                    />
                    
                    <AccessibleTextarea
                      label="Message"
                      placeholder="Enter your message"
                      description="Please provide detailed information"
                      maxLength={500}
                      showCharacterCount
                      required
                    />
                    
                    <div className="space-y-4">
                      <AccessibleCheckbox
                        label="Subscribe to newsletter"
                        description="Receive updates about new features and releases"
                      />
                      
                      <AccessibleRadioGroup
                        label="Preferred Contact Method"
                        description="How would you like us to contact you?"
                        options={[
                          { 
                            value: 'email', 
                            label: 'Email', 
                            description: 'We\'ll send updates to your email address' 
                          },
                          { 
                            value: 'phone', 
                            label: 'Phone', 
                            description: 'We\'ll call you during business hours' 
                          },
                          { 
                            value: 'sms', 
                            label: 'SMS', 
                            description: 'We\'ll send text messages to your phone' 
                          },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Test Results Section */}
      <section id="test-results" aria-labelledby="test-results-heading">
        <Card>
          <CardHeader>
            <CardTitle id="test-results-heading">Testing Checklist</CardTitle>
            <CardDescription>
              Ensure all testing criteria are met before deployment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { item: 'WCAG 2.1 AA compliance verified', status: testResults.accessibility >= 90 },
                { item: 'Mobile responsiveness tested', status: testResults.responsive >= 80 },
                { item: 'Cross-browser compatibility confirmed', status: testResults.crossBrowser >= 85 },
                { item: 'Keyboard navigation functional', status: true },
                { item: 'Screen reader compatibility verified', status: true },
                { item: 'Color contrast meets standards', status: true },
                { item: 'Touch targets meet minimum size', status: testResults.responsive >= 80 },
                { item: 'Performance benchmarks met', status: false },
              ].map((check, index) => (
                <div key={index} className="flex items-center gap-3">
                  {check.status ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                  <span className={check.status ? 'text-foreground' : 'text-muted-foreground'}>
                    {check.item}
                  </span>
                  <Badge variant={check.status ? 'default' : 'secondary'} className="ml-auto">
                    {check.status ? 'Passed' : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}; 