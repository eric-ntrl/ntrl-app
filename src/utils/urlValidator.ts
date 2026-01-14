/**
 * URL validation utilities with domain whitelist support.
 * Used to prevent arbitrary URL fetching and protect against SSRF attacks.
 */

/**
 * Whitelist of allowed news source domains.
 * Add new trusted sources here as they are onboarded.
 */
const ALLOWED_NEWS_DOMAINS = [
  // Major wire services
  'apnews.com',
  'reuters.com',
  'afp.com',

  // US national news
  'npr.org',
  'pbs.org',
  'cbsnews.com',
  'nbcnews.com',
  'abcnews.go.com',

  // Major US newspapers
  'nytimes.com',
  'washingtonpost.com',
  'wsj.com',
  'latimes.com',
  'chicagotribune.com',
  'usatoday.com',

  // Other US news
  'foxnews.com',
  'nypost.com',
  'politico.com',
  'thehill.com',

  // International
  'bbc.com',
  'bbc.co.uk',
  'theguardian.com',
  'economist.com',
  'ft.com',
  'aljazeera.com',
  'dw.com',

  // Tech news
  'arstechnica.com',
  'theverge.com',
  'wired.com',
  'techcrunch.com',

  // Business
  'bloomberg.com',
  'cnbc.com',
  'marketwatch.com',
  'fortune.com',

  // Our own API
  'api.ntrl.app',
  'api-staging-7b4d.up.railway.app',
  'localhost',
];

/**
 * Validation result with details about why validation failed.
 */
export type UrlValidationResult = {
  valid: boolean;
  reason?: 'invalid_url' | 'invalid_protocol' | 'domain_not_allowed' | 'blocked_pattern';
  url?: URL;
};

/**
 * Patterns that should be blocked regardless of domain.
 * These indicate potentially dangerous URLs.
 */
const BLOCKED_PATTERNS = [
  /^javascript:/i,
  /^data:/i,
  /^file:/i,
  /^ftp:/i,
  /^mailto:/i,
  /^tel:/i,
  // Block URLs with credentials
  /:\/\/[^/]*@/,
  // Block localhost patterns in non-development
  // (handled separately in validateUrl)
];

/**
 * Check if a hostname matches an allowed domain.
 * Handles both exact matches and subdomains.
 */
function isDomainAllowed(hostname: string, allowedDomains: string[]): boolean {
  const normalizedHostname = hostname.toLowerCase();

  return allowedDomains.some((domain) => {
    const normalizedDomain = domain.toLowerCase();
    // Exact match
    if (normalizedHostname === normalizedDomain) {
      return true;
    }
    // Subdomain match (e.g., "www.bbc.com" matches "bbc.com")
    if (normalizedHostname.endsWith(`.${normalizedDomain}`)) {
      return true;
    }
    return false;
  });
}

/**
 * Validate a URL for security and domain whitelist compliance.
 *
 * @param url - The URL string to validate
 * @param options - Validation options
 * @returns Validation result with details
 */
export function validateUrl(
  url: string,
  options: {
    allowedDomains?: string[];
    requireHttps?: boolean;
    allowLocalhost?: boolean;
    skipDomainCheck?: boolean;
  } = {}
): UrlValidationResult {
  const {
    allowedDomains = ALLOWED_NEWS_DOMAINS,
    requireHttps = false,
    allowLocalhost = false,
    skipDomainCheck = false,
  } = options;

  // Check for blocked patterns first
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(url)) {
      return { valid: false, reason: 'blocked_pattern' };
    }
  }

  // Try to parse the URL
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, reason: 'invalid_url' };
  }

  // Protocol check
  const validProtocols = requireHttps ? ['https:'] : ['http:', 'https:'];
  if (!validProtocols.includes(parsed.protocol)) {
    return { valid: false, reason: 'invalid_protocol' };
  }

  // Localhost handling
  if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
    if (!allowLocalhost) {
      return { valid: false, reason: 'domain_not_allowed' };
    }
    return { valid: true, url: parsed };
  }

  // Domain whitelist check (can be skipped for basic validation)
  if (!skipDomainCheck && !isDomainAllowed(parsed.hostname, allowedDomains)) {
    return { valid: false, reason: 'domain_not_allowed' };
  }

  return { valid: true, url: parsed };
}

/**
 * Simple boolean check for URL validity.
 * Use validateUrl() for detailed error information.
 */
export function isValidUrl(url: string): boolean {
  const result = validateUrl(url, { allowLocalhost: true });
  return result.valid;
}

/**
 * Check if a URL is from an allowed news source domain.
 */
export function isAllowedNewsDomain(url: string): boolean {
  const result = validateUrl(url, { allowLocalhost: false });
  return result.valid;
}

/**
 * Sanitize a URL by removing credentials and normalizing.
 * Returns null if URL is invalid.
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Remove credentials
    parsed.username = '';
    parsed.password = '';
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Extract the domain from a URL.
 * Returns null if URL is invalid.
 */
export function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return null;
  }
}

/**
 * Get the list of allowed news domains.
 * Useful for displaying to users or debugging.
 */
export function getAllowedDomains(): readonly string[] {
  return ALLOWED_NEWS_DOMAINS;
}
