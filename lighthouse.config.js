module.exports = {
  extends: 'lighthouse:default',
  settings: {
    onlyAudits: [
      // Performance
      'first-contentful-paint',
      'largest-contentful-paint',
      'cumulative-layout-shift',
      'total-blocking-time',
      'speed-index',
      
      // Accessibility
      'accesskeys',
      'aria-allowed-attr',
      'aria-command-name',
      'aria-hidden-body',
      'aria-hidden-focus',
      'aria-input-field-name',
      'aria-meter-name',
      'aria-progressbar-name',
      'aria-required-attr',
      'aria-required-children',
      'aria-required-parent',
      'aria-roles',
      'aria-toggle-field-name',
      'aria-tooltip-name',
      'aria-treeitem-name',
      'aria-valid-attr-value',
      'aria-valid-attr',
      'button-name',
      'bypass',
      'color-contrast',
      'definition-list',
      'dlitem',
      'document-title',
      'duplicate-id-active',
      'duplicate-id-aria',
      'form-field-multiple-labels',
      'frame-title',
      'heading-order',
      'html-has-lang',
      'html-lang-valid',
      'image-alt',
      'input-image-alt',
      'label',
      'landmark-one-main',
      'link-name',
      'list',
      'listitem',
      'meta-refresh',
      'meta-viewport',
      'object-alt',
      'tabindex',
      'td-headers-attr',
      'th-has-data-cells',
      'valid-lang',
      'video-caption',
      
      // Best Practices
      'is-on-https',
      'uses-http2',
      'uses-passive-event-listeners',
      'no-document-write',
      'external-anchors-use-rel-noopener',
      'geolocation-on-start',
      'doctype',
      'charset',
      'dom-size',
      'no-vulnerable-libraries',
      
      // SEO
      'viewport',
      'document-title',
      'meta-description',
      'http-status-code',
      'link-text',
      'crawlable-anchors',
      'is-crawlable',
      'robots-txt',
      'image-alt',
      'hreflang',
      'canonical',
      
      // PWA
      'service-worker',
      'works-offline',
      'without-javascript',
      'is-on-https',
      'redirects-http',
      'viewport',
      'content-width',
      'installable-manifest',
      'splash-screen',
      'themed-omnibox',
      'maskable-icon',
    ],
    
    // Throttling settings for consistent results
    throttlingMethod: 'simulate',
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
    
    // Screen emulation
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
    
    // Form factor
    formFactor: 'desktop',
    
    // Skip certain audits that may not be relevant
    skipAudits: [
      'uses-rel-preload',
      'uses-rel-preconnect',
    ],
  },
  
  // Custom audit categories
  categories: {
    performance: {
      title: 'Performance',
      description: 'These checks ensure that your page is optimized for speed.',
      auditRefs: [
        { id: 'first-contentful-paint', weight: 10, group: 'metrics' },
        { id: 'largest-contentful-paint', weight: 25, group: 'metrics' },
        { id: 'cumulative-layout-shift', weight: 25, group: 'metrics' },
        { id: 'total-blocking-time', weight: 30, group: 'metrics' },
        { id: 'speed-index', weight: 10, group: 'metrics' },
      ],
    },
    
    accessibility: {
      title: 'Accessibility',
      description: 'These checks highlight opportunities to improve the accessibility of your web app.',
      auditRefs: [
        { id: 'accesskeys', weight: 0, group: 'a11y-best-practices' },
        { id: 'aria-allowed-attr', weight: 0, group: 'a11y-aria' },
        { id: 'aria-command-name', weight: 0, group: 'a11y-aria' },
        { id: 'aria-hidden-body', weight: 0, group: 'a11y-aria' },
        { id: 'aria-hidden-focus', weight: 0, group: 'a11y-aria' },
        { id: 'aria-input-field-name', weight: 0, group: 'a11y-aria' },
        { id: 'aria-meter-name', weight: 0, group: 'a11y-aria' },
        { id: 'aria-progressbar-name', weight: 0, group: 'a11y-aria' },
        { id: 'aria-required-attr', weight: 0, group: 'a11y-aria' },
        { id: 'aria-required-children', weight: 0, group: 'a11y-aria' },
        { id: 'aria-required-parent', weight: 0, group: 'a11y-aria' },
        { id: 'aria-roles', weight: 0, group: 'a11y-aria' },
        { id: 'aria-toggle-field-name', weight: 0, group: 'a11y-aria' },
        { id: 'aria-tooltip-name', weight: 0, group: 'a11y-aria' },
        { id: 'aria-treeitem-name', weight: 0, group: 'a11y-aria' },
        { id: 'aria-valid-attr-value', weight: 0, group: 'a11y-aria' },
        { id: 'aria-valid-attr', weight: 0, group: 'a11y-aria' },
        { id: 'button-name', weight: 10, group: 'a11y-names-labels' },
        { id: 'bypass', weight: 3, group: 'a11y-navigation' },
        { id: 'color-contrast', weight: 3, group: 'a11y-color-contrast' },
        { id: 'definition-list', weight: 0, group: 'a11y-tables-lists' },
        { id: 'dlitem', weight: 0, group: 'a11y-tables-lists' },
        { id: 'document-title', weight: 3, group: 'a11y-names-labels' },
        { id: 'duplicate-id-active', weight: 0, group: 'a11y-navigation' },
        { id: 'duplicate-id-aria', weight: 0, group: 'a11y-aria' },
        { id: 'form-field-multiple-labels', weight: 0, group: 'a11y-names-labels' },
        { id: 'frame-title', weight: 0, group: 'a11y-names-labels' },
        { id: 'heading-order', weight: 2, group: 'a11y-navigation' },
        { id: 'html-has-lang', weight: 3, group: 'a11y-language' },
        { id: 'html-lang-valid', weight: 0, group: 'a11y-language' },
        { id: 'image-alt', weight: 10, group: 'a11y-names-labels' },
        { id: 'input-image-alt', weight: 0, group: 'a11y-names-labels' },
        { id: 'label', weight: 10, group: 'a11y-names-labels' },
        { id: 'landmark-one-main', weight: 0, group: 'a11y-navigation' },
        { id: 'link-name', weight: 3, group: 'a11y-names-labels' },
        { id: 'list', weight: 0, group: 'a11y-tables-lists' },
        { id: 'listitem', weight: 0, group: 'a11y-tables-lists' },
        { id: 'meta-refresh', weight: 0, group: 'a11y-best-practices' },
        { id: 'meta-viewport', weight: 0, group: 'a11y-best-practices' },
        { id: 'object-alt', weight: 0, group: 'a11y-names-labels' },
        { id: 'tabindex', weight: 0, group: 'a11y-navigation' },
        { id: 'td-headers-attr', weight: 0, group: 'a11y-tables-lists' },
        { id: 'th-has-data-cells', weight: 0, group: 'a11y-tables-lists' },
        { id: 'valid-lang', weight: 0, group: 'a11y-language' },
        { id: 'video-caption', weight: 0, group: 'a11y-audio-video' },
      ],
    },
    
    'best-practices': {
      title: 'Best Practices',
      description: 'These checks ensure that your page follows web development best practices.',
      auditRefs: [
        { id: 'is-on-https', weight: 5, group: 'best-practices-trust-safety' },
        { id: 'uses-http2', weight: 0, group: 'best-practices-general' },
        { id: 'uses-passive-event-listeners', weight: 0, group: 'best-practices-general' },
        { id: 'no-document-write', weight: 0, group: 'best-practices-general' },
        { id: 'external-anchors-use-rel-noopener', weight: 0, group: 'best-practices-trust-safety' },
        { id: 'geolocation-on-start', weight: 0, group: 'best-practices-ux' },
        { id: 'doctype', weight: 0, group: 'best-practices-general' },
        { id: 'charset', weight: 0, group: 'best-practices-general' },
        { id: 'dom-size', weight: 0, group: 'best-practices-general' },
        { id: 'no-vulnerable-libraries', weight: 0, group: 'best-practices-trust-safety' },
      ],
    },
    
    seo: {
      title: 'SEO',
      description: 'These checks ensure that your page is optimized for search engine results ranking.',
      auditRefs: [
        { id: 'viewport', weight: 5, group: 'seo-mobile' },
        { id: 'document-title', weight: 5, group: 'seo-content' },
        { id: 'meta-description', weight: 5, group: 'seo-content' },
        { id: 'http-status-code', weight: 5, group: 'seo-crawl' },
        { id: 'link-text', weight: 5, group: 'seo-content' },
        { id: 'crawlable-anchors', weight: 5, group: 'seo-crawl' },
        { id: 'is-crawlable', weight: 5, group: 'seo-crawl' },
        { id: 'robots-txt', weight: 5, group: 'seo-crawl' },
        { id: 'image-alt', weight: 5, group: 'seo-content' },
        { id: 'hreflang', weight: 0, group: 'seo-content' },
        { id: 'canonical', weight: 0, group: 'seo-content' },
      ],
    },
    
    pwa: {
      title: 'Progressive Web App',
      description: 'These checks validate the aspects of a Progressive Web App.',
      auditRefs: [
        { id: 'service-worker', weight: 1, group: 'pwa-optimized' },
        { id: 'works-offline', weight: 1, group: 'pwa-optimized' },
        { id: 'without-javascript', weight: 1, group: 'pwa-optimized' },
        { id: 'is-on-https', weight: 2, group: 'pwa-installable' },
        { id: 'redirects-http', weight: 0, group: 'pwa-installable' },
        { id: 'viewport', weight: 2, group: 'pwa-installable' },
        { id: 'content-width', weight: 1, group: 'pwa-installable' },
        { id: 'installable-manifest', weight: 2, group: 'pwa-installable' },
        { id: 'splash-screen', weight: 1, group: 'pwa-installable' },
        { id: 'themed-omnibox', weight: 1, group: 'pwa-installable' },
        { id: 'maskable-icon', weight: 1, group: 'pwa-installable' },
      ],
    },
  },
}; 