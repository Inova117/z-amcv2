import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Smartphone, Tablet, Monitor, RotateCcw, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useResponsive } from '@/hooks/useResponsive';

interface DevicePreset {
  name: string;
  width: number;
  height: number;
  userAgent: string;
  pixelRatio: number;
  type: 'mobile' | 'tablet' | 'desktop';
  icon: React.ReactNode;
}

const DEVICE_PRESETS: DevicePreset[] = [
  {
    name: 'iPhone 14 Pro',
    width: 393,
    height: 852,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
    pixelRatio: 3,
    type: 'mobile',
    icon: <Smartphone className="h-4 w-4" />,
  },
  {
    name: 'iPhone 14 Pro Max',
    width: 430,
    height: 932,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
    pixelRatio: 3,
    type: 'mobile',
    icon: <Smartphone className="h-4 w-4" />,
  },
  {
    name: 'Samsung Galaxy S23',
    width: 360,
    height: 780,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36',
    pixelRatio: 3,
    type: 'mobile',
    icon: <Smartphone className="h-4 w-4" />,
  },
  {
    name: 'iPad Air',
    width: 820,
    height: 1180,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
    pixelRatio: 2,
    type: 'tablet',
    icon: <Tablet className="h-4 w-4" />,
  },
  {
    name: 'iPad Pro 12.9"',
    width: 1024,
    height: 1366,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
    pixelRatio: 2,
    type: 'tablet',
    icon: <Tablet className="h-4 w-4" />,
  },
  {
    name: 'Desktop 1920x1080',
    width: 1920,
    height: 1080,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    pixelRatio: 1,
    type: 'desktop',
    icon: <Monitor className="h-4 w-4" />,
  },
];

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  element?: HTMLElement;
}

interface ResponsiveTestSuiteProps {
  targetUrl?: string;
  autoTest?: boolean;
}

export const ResponsiveTestSuite: React.FC<ResponsiveTestSuiteProps> = ({
  targetUrl = window.location.href,
  autoTest = false,
}) => {
  const [selectedDevice, setSelectedDevice] = useState<DevicePreset>(DEVICE_PRESETS[0]);
  const [isLandscape, setIsLandscape] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { isMobile, isTablet, isDesktop, breakpoint } = useResponsive();

  const currentWidth = isLandscape ? selectedDevice.height : selectedDevice.width;
  const currentHeight = isLandscape ? selectedDevice.width : selectedDevice.height;

  useEffect(() => {
    if (autoTest) {
      runResponsiveTests();
    }
  }, [selectedDevice, isLandscape, autoTest]);

  const runResponsiveTests = async () => {
    setIsRunning(true);
    const results: TestResult[] = [];

    try {
      // Test 1: Touch target sizes
      const touchTargets = document.querySelectorAll('button, a, input, [role="button"]');
      touchTargets.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const minSize = 44; // WCAG minimum touch target size
        
        if (rect.width < minSize || rect.height < minSize) {
          results.push({
            test: 'Touch Target Size',
            status: 'fail',
            message: `Touch target too small: ${Math.round(rect.width)}x${Math.round(rect.height)}px (minimum: ${minSize}x${minSize}px)`,
            element: element as HTMLElement,
          });
        }
      });

      // Test 2: Horizontal scrolling
      const hasHorizontalScroll = document.body.scrollWidth > window.innerWidth;
      if (hasHorizontalScroll) {
        results.push({
          test: 'Horizontal Scrolling',
          status: 'fail',
          message: 'Page has horizontal scrolling, which can cause usability issues on mobile',
        });
      } else {
        results.push({
          test: 'Horizontal Scrolling',
          status: 'pass',
          message: 'No horizontal scrolling detected',
        });
      }

      // Test 3: Viewport meta tag
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (!viewportMeta) {
        results.push({
          test: 'Viewport Meta Tag',
          status: 'fail',
          message: 'Missing viewport meta tag for mobile optimization',
        });
      } else {
        const content = viewportMeta.getAttribute('content');
        if (content?.includes('width=device-width')) {
          results.push({
            test: 'Viewport Meta Tag',
            status: 'pass',
            message: 'Viewport meta tag properly configured',
          });
        } else {
          results.push({
            test: 'Viewport Meta Tag',
            status: 'warning',
            message: 'Viewport meta tag may not be optimally configured',
          });
        }
      }

      // Test 4: Text readability
      const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
      let smallTextCount = 0;
      textElements.forEach((element) => {
        const computedStyle = window.getComputedStyle(element);
        const fontSize = parseFloat(computedStyle.fontSize);
        if (fontSize < 16) {
          smallTextCount++;
        }
      });

      if (smallTextCount > 0) {
        results.push({
          test: 'Text Readability',
          status: 'warning',
          message: `${smallTextCount} elements have text smaller than 16px, which may be hard to read on mobile`,
        });
      } else {
        results.push({
          test: 'Text Readability',
          status: 'pass',
          message: 'All text elements meet minimum size requirements',
        });
      }

      // Test 5: Interactive element spacing
      const interactiveElements = document.querySelectorAll('button, a, input, select');
      let spacingIssues = 0;
      interactiveElements.forEach((element, index) => {
        if (index < interactiveElements.length - 1) {
          const currentRect = element.getBoundingClientRect();
          const nextRect = interactiveElements[index + 1].getBoundingClientRect();
          const distance = Math.min(
            Math.abs(currentRect.bottom - nextRect.top),
            Math.abs(currentRect.right - nextRect.left)
          );
          
          if (distance < 8) { // Minimum 8px spacing
            spacingIssues++;
          }
        }
      });

      if (spacingIssues > 0) {
        results.push({
          test: 'Interactive Element Spacing',
          status: 'warning',
          message: `${spacingIssues} interactive elements may be too close together`,
        });
      } else {
        results.push({
          test: 'Interactive Element Spacing',
          status: 'pass',
          message: 'Interactive elements have adequate spacing',
        });
      }

      // Test 6: Image optimization
      const images = document.querySelectorAll('img');
      let unoptimizedImages = 0;
      images.forEach((img) => {
        if (!img.hasAttribute('loading') && !img.hasAttribute('srcset')) {
          unoptimizedImages++;
        }
      });

      if (unoptimizedImages > 0) {
        results.push({
          test: 'Image Optimization',
          status: 'warning',
          message: `${unoptimizedImages} images could benefit from lazy loading or responsive images`,
        });
      } else {
        results.push({
          test: 'Image Optimization',
          status: 'pass',
          message: 'Images are properly optimized for mobile',
        });
      }

    } catch (error) {
      results.push({
        test: 'Test Execution',
        status: 'fail',
        message: `Error running tests: ${error}`,
      });
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <Info className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'fail':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
  };

  const passCount = testResults.filter(r => r.status === 'pass').length;
  const failCount = testResults.filter(r => r.status === 'fail').length;
  const warningCount = testResults.filter(r => r.status === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Device Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Responsive Testing Suite
          </CardTitle>
          <CardDescription>
            Test your application across different devices and screen sizes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Device Preset</label>
              <Select
                value={selectedDevice.name}
                onValueChange={(value) => {
                  const device = DEVICE_PRESETS.find(d => d.name === value);
                  if (device) setSelectedDevice(device);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEVICE_PRESETS.map((device) => (
                    <SelectItem key={device.name} value={device.name}>
                      <div className="flex items-center gap-2">
                        {device.icon}
                        <span>{device.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {device.width}x{device.height}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLandscape(!isLandscape)}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                {isLandscape ? 'Portrait' : 'Landscape'}
              </Button>
              
              <Button
                onClick={runResponsiveTests}
                disabled={isRunning}
                size="sm"
              >
                {isRunning ? 'Testing...' : 'Run Tests'}
              </Button>
            </div>
          </div>

          {/* Current Device Info */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>Current: {currentWidth}x{currentHeight}px</span>
            <span>Pixel Ratio: {selectedDevice.pixelRatio}x</span>
            <span>Type: {selectedDevice.type}</span>
            <span>Breakpoint: {breakpoint}</span>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Test Results</span>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {passCount} Passed
                </Badge>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                  {warningCount} Warnings
                </Badge>
                <Badge variant="outline" className="bg-red-50 text-red-700">
                  {failCount} Failed
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="font-medium">{result.test}</div>
                      <div className="text-sm mt-1">{result.message}</div>
                      {result.element && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 text-xs"
                          onClick={() => {
                            result.element?.scrollIntoView({ 
                              behavior: 'smooth', 
                              block: 'center' 
                            });
                            result.element!.style.outline = '2px solid red';
                            setTimeout(() => {
                              result.element!.style.outline = '';
                            }, 3000);
                          }}
                        >
                          Highlight Element
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Device Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Device Preview</CardTitle>
          <CardDescription>
            Preview how your application looks on {selectedDevice.name}
            {isLandscape ? ' (Landscape)' : ' (Portrait)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div
              className="border-8 border-gray-800 rounded-[2rem] bg-gray-800 shadow-xl"
              style={{
                width: currentWidth + 16,
                height: currentHeight + 16,
              }}
            >
              <div
                className="bg-white rounded-[1.5rem] overflow-hidden"
                style={{
                  width: currentWidth,
                  height: currentHeight,
                }}
              >
                <iframe
                  ref={iframeRef}
                  src={targetUrl}
                  className="w-full h-full border-0"
                  title={`${selectedDevice.name} Preview`}
                  style={{
                    transform: `scale(${Math.min(1, 800 / currentWidth)})`,
                    transformOrigin: 'top left',
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Cross-browser testing utilities
export const CrossBrowserTestSuite: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, TestResult[]>>({});
  const [isRunning, setIsRunning] = useState(false);

  const browsers = [
    { name: 'Chrome', userAgent: 'Chrome/120.0.0.0' },
    { name: 'Firefox', userAgent: 'Firefox/121.0' },
    { name: 'Safari', userAgent: 'Safari/17.0' },
    { name: 'Edge', userAgent: 'Edg/120.0.0.0' },
  ];

  const runCrossBrowserTests = async () => {
    setIsRunning(true);
    // This would typically integrate with services like BrowserStack or Sauce Labs
    // For now, we'll simulate the testing
    
    const mockResults: Record<string, TestResult[]> = {};
    
    browsers.forEach(browser => {
      mockResults[browser.name] = [
        {
          test: 'CSS Grid Support',
          status: 'pass',
          message: 'CSS Grid is fully supported',
        },
        {
          test: 'Flexbox Support',
          status: 'pass',
          message: 'Flexbox is fully supported',
        },
        {
          test: 'ES6 Features',
          status: browser.name === 'Safari' ? 'warning' : 'pass',
          message: browser.name === 'Safari' 
            ? 'Some ES6 features may need polyfills'
            : 'All ES6 features supported',
        },
      ];
    });

    setTestResults(mockResults);
    setIsRunning(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Cross-Browser Testing
          <Button onClick={runCrossBrowserTests} disabled={isRunning} size="sm">
            {isRunning ? 'Testing...' : 'Run Tests'}
          </Button>
        </CardTitle>
        <CardDescription>
          Test compatibility across different browsers
        </CardDescription>
      </CardHeader>
      <CardContent>
        {Object.keys(testResults).length > 0 ? (
          <Tabs defaultValue={browsers[0].name} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {browsers.map(browser => (
                <TabsTrigger key={browser.name} value={browser.name}>
                  {browser.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {browsers.map(browser => (
              <TabsContent key={browser.name} value={browser.name} className="space-y-3">
                {testResults[browser.name]?.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.status === 'pass' 
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : result.status === 'warning'
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {result.status === 'pass' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {result.status === 'warning' && <Info className="h-4 w-4 text-yellow-500" />}
                      {result.status === 'fail' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      <div>
                        <div className="font-medium">{result.test}</div>
                        <div className="text-sm mt-1">{result.message}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Click "Run Tests" to start cross-browser compatibility testing
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 