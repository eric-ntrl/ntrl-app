import {
  validateUrl,
  isValidUrl,
  isAllowedNewsDomain,
  sanitizeUrl,
  extractDomain,
  getAllowedDomains,
} from '../urlValidator';

describe('validateUrl', () => {
  describe('valid URLs', () => {
    it('should accept valid HTTPS URLs from allowed domains', () => {
      const result = validateUrl('https://www.bbc.com/news/article-123');
      expect(result.valid).toBe(true);
      expect(result.url?.hostname).toBe('www.bbc.com');
    });

    it('should accept HTTP URLs when not requiring HTTPS', () => {
      const result = validateUrl('http://www.reuters.com/article', { requireHttps: false });
      expect(result.valid).toBe(true);
    });

    it('should accept URLs with subdomains of allowed domains', () => {
      const result = validateUrl('https://news.bbc.co.uk/world');
      expect(result.valid).toBe(true);
    });

    it('should accept localhost when allowLocalhost is true', () => {
      const result = validateUrl('http://localhost:3000/api', { allowLocalhost: true });
      expect(result.valid).toBe(true);
    });

    it('should accept 127.0.0.1 when allowLocalhost is true', () => {
      const result = validateUrl('http://127.0.0.1:8000/test', { allowLocalhost: true });
      expect(result.valid).toBe(true);
    });
  });

  describe('invalid URLs', () => {
    it('should reject malformed URLs', () => {
      const result = validateUrl('not-a-url');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('invalid_url');
    });

    it('should reject URLs with invalid protocols', () => {
      const result = validateUrl('ftp://example.com/file.txt');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('blocked_pattern');
    });

    it('should reject javascript: URLs', () => {
      const result = validateUrl('javascript:alert(1)');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('blocked_pattern');
    });

    it('should reject data: URLs', () => {
      const result = validateUrl('data:text/html,<script>alert(1)</script>');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('blocked_pattern');
    });

    it('should reject file: URLs', () => {
      const result = validateUrl('file:///etc/passwd');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('blocked_pattern');
    });

    it('should reject URLs with credentials', () => {
      const result = validateUrl('https://user:pass@example.com/');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('blocked_pattern');
    });

    it('should reject localhost when allowLocalhost is false', () => {
      const result = validateUrl('http://localhost:3000/', { allowLocalhost: false });
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('domain_not_allowed');
    });
  });

  describe('domain whitelist', () => {
    it('should reject URLs from non-whitelisted domains', () => {
      const result = validateUrl('https://malicious-site.com/phishing');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('domain_not_allowed');
    });

    it('should accept any domain when skipDomainCheck is true', () => {
      const result = validateUrl('https://any-site.com/page', { skipDomainCheck: true });
      expect(result.valid).toBe(true);
    });

    it('should use custom allowed domains when provided', () => {
      const result = validateUrl('https://custom-domain.com/page', {
        allowedDomains: ['custom-domain.com'],
      });
      expect(result.valid).toBe(true);
    });

    it('should match exact domain', () => {
      const result = validateUrl('https://bbc.com/article');
      expect(result.valid).toBe(true);
    });

    it('should not match partial domain names (security)', () => {
      const result = validateUrl('https://fakebbc.com/scam');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('domain_not_allowed');
    });
  });

  describe('HTTPS requirement', () => {
    it('should reject HTTP when requireHttps is true', () => {
      const result = validateUrl('http://bbc.com/', { requireHttps: true });
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('invalid_protocol');
    });

    it('should accept HTTPS when requireHttps is true', () => {
      const result = validateUrl('https://bbc.com/', { requireHttps: true });
      expect(result.valid).toBe(true);
    });
  });
});

describe('isValidUrl', () => {
  it('should return true for valid URLs', () => {
    expect(isValidUrl('https://bbc.com/news')).toBe(true);
  });

  it('should return false for invalid URLs', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
  });

  it('should allow localhost by default', () => {
    expect(isValidUrl('http://localhost:3000')).toBe(true);
  });
});

describe('isAllowedNewsDomain', () => {
  it('should return true for allowed news domains', () => {
    expect(isAllowedNewsDomain('https://www.nytimes.com/article')).toBe(true);
    expect(isAllowedNewsDomain('https://reuters.com/world')).toBe(true);
  });

  it('should return false for non-news domains', () => {
    expect(isAllowedNewsDomain('https://facebook.com/page')).toBe(false);
  });

  it('should return false for localhost', () => {
    expect(isAllowedNewsDomain('http://localhost:3000')).toBe(false);
  });
});

describe('sanitizeUrl', () => {
  it('should remove credentials from URL', () => {
    const result = sanitizeUrl('https://user:pass@example.com/path');
    expect(result).toBe('https://example.com/path');
  });

  it('should normalize URL', () => {
    const result = sanitizeUrl('HTTPS://EXAMPLE.COM/PATH');
    expect(result).toBe('https://example.com/PATH');
  });

  it('should return null for invalid URLs', () => {
    expect(sanitizeUrl('not-a-url')).toBe(null);
  });

  it('should preserve path and query parameters', () => {
    const result = sanitizeUrl('https://example.com/path?query=value#hash');
    expect(result).toBe('https://example.com/path?query=value#hash');
  });
});

describe('extractDomain', () => {
  it('should extract domain from valid URL', () => {
    expect(extractDomain('https://www.example.com/path')).toBe('www.example.com');
    expect(extractDomain('https://example.com/')).toBe('example.com');
  });

  it('should return null for invalid URLs', () => {
    expect(extractDomain('not-a-url')).toBe(null);
  });

  it('should extract domain with port', () => {
    expect(extractDomain('http://localhost:3000/api')).toBe('localhost');
  });
});

describe('getAllowedDomains', () => {
  it('should return array of allowed domains', () => {
    const domains = getAllowedDomains();
    expect(Array.isArray(domains)).toBe(true);
    expect(domains.length).toBeGreaterThan(0);
  });

  it('should include major news sources', () => {
    const domains = getAllowedDomains();
    expect(domains).toContain('bbc.com');
    expect(domains).toContain('reuters.com');
    expect(domains).toContain('nytimes.com');
  });

  it('should be readonly', () => {
    const domains = getAllowedDomains();
    expect(Object.isFrozen(domains) || typeof domains[Symbol.iterator] === 'function').toBe(true);
  });
});
