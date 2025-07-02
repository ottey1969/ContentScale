/**
 * Universal Branding Replacement Script
 * Use this code to replace any third-party branding with custom SOFEIA branding
 * 
 * Usage: Add this script after any third-party accessibility or widget scripts
 */

function replaceBrandingWithSofeia() {
  // Configuration - customize these values as needed
  const CUSTOM_BRANDING = 'POWERED BY ❤️ SOFEIA (ContentScale.site)';
  const CUSTOM_LINK = 'https://contentscale.site';
  
  // List of branding terms to replace (add more as needed)
  const BRANDING_TERMS = [
    'ADA Bundle',
    'POWERED BY',
    'adabundle',
    'Powered by',
    'Created by',
    'Made by',
    'Developed by',
    'Built with',
    'Widget by',
    'Accessibility by'
  ];
  
  // List of domains to replace links for (add more as needed)
  const DOMAINS_TO_REPLACE = [
    'adabundle.com',
    'adabundle.io',
    'ada-bundle.com'
  ];

  function replaceBrandingInElement(element) {
    // Replace text content
    if (element.textContent) {
      let hasReplacement = false;
      BRANDING_TERMS.forEach(term => {
        if (element.textContent.toLowerCase().includes(term.toLowerCase())) {
          hasReplacement = true;
        }
      });
      
      if (hasReplacement) {
        // Create regex pattern from branding terms
        const pattern = new RegExp(BRANDING_TERMS.join('|'), 'gi');
        element.innerHTML = element.innerHTML.replace(pattern, CUSTOM_BRANDING);
      }
    }
    
    // Replace links
    if (element.tagName === 'A' && element.href) {
      DOMAINS_TO_REPLACE.forEach(domain => {
        if (element.href.includes(domain)) {
          element.href = CUSTOM_LINK;
          element.textContent = CUSTOM_BRANDING;
          element.title = CUSTOM_BRANDING;
        }
      });
    }
  }

  function scanAndReplace() {
    // Method 1: Target common accessibility widget selectors
    const commonSelectors = [
      '[id*="ada"]',
      '[class*="ada"]',
      '[data-*="ada"]',
      '[id*="accessibility"]',
      '[class*="accessibility"]',
      '[id*="widget"]',
      '[class*="widget"]',
      '[role="complementary"]',
      '[aria-label*="accessibility"]',
      '.powered-by',
      '.branding',
      '.attribution'
    ];
    
    commonSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(replaceBrandingInElement);
      } catch (e) {
        // Ignore invalid selectors
      }
    });
    
    // Method 2: Scan all elements for branding terms
    const allElements = document.querySelectorAll('*');
    allElements.forEach(element => {
      if (element.textContent && element.textContent.length < 200) { // Only check short text elements
        BRANDING_TERMS.forEach(term => {
          if (element.textContent.toLowerCase().includes(term.toLowerCase())) {
            replaceBrandingInElement(element);
          }
        });
      }
    });
    
    // Method 3: Replace all links to specified domains
    DOMAINS_TO_REPLACE.forEach(domain => {
      const links = document.querySelectorAll(`a[href*="${domain}"]`);
      links.forEach(link => {
        link.href = CUSTOM_LINK;
        link.textContent = CUSTOM_BRANDING;
        link.title = CUSTOM_BRANDING;
      });
    });
  }

  // Create mutation observer to catch dynamically added content
  const observer = new MutationObserver(function(mutations) {
    let shouldScan = false;
    
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            shouldScan = true;
          }
        });
      }
      
      if (mutation.type === 'characterData') {
        shouldScan = true;
      }
    });
    
    if (shouldScan) {
      setTimeout(scanAndReplace, 100); // Small delay to ensure content is fully loaded
    }
  });
  
  // Start observing
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['href', 'src', 'title']
    });
  }
  
  // Initial scan
  scanAndReplace();
  
  // Additional scans with delays to catch late-loading content
  setTimeout(scanAndReplace, 1000);
  setTimeout(scanAndReplace, 3000);
  setTimeout(scanAndReplace, 5000);
  
  // Scan on window load
  window.addEventListener('load', scanAndReplace);
  
  // Return observer so it can be disconnected if needed
  return observer;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', replaceBrandingWithSofeia);
} else {
  replaceBrandingWithSofeia();
}

// For manual initialization, expose the function globally
window.replaceBrandingWithSofeia = replaceBrandingWithSofeia;

/* 
 * USAGE EXAMPLES:
 * 
 * 1. For ADA Bundle or similar accessibility widgets:
 * <script src="third-party-widget.js"></script>
 * <script src="branding-replacement-code.js"></script>
 * 
 * 2. For inline use:
 * <script>
 *   // Load your third-party script first
 *   // Then paste the replaceBrandingWithSofeia function
 *   replaceBrandingWithSofeia();
 * </script>
 * 
 * 3. For multiple widgets:
 * <script src="widget1.js"></script>
 * <script src="widget2.js"></script>
 * <script src="branding-replacement-code.js"></script>
 * 
 * The script will automatically detect and replace branding from any third-party service.
 */