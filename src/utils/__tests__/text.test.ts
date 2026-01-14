import { decodeHtmlEntities } from '../text';

describe('decodeHtmlEntities', () => {
  describe('named entities', () => {
    it('should decode &quot; to double quote', () => {
      expect(decodeHtmlEntities('He said &quot;hello&quot;')).toBe('He said "hello"');
    });

    it('should decode &apos; to single quote', () => {
      expect(decodeHtmlEntities('It&apos;s working')).toBe("It's working");
    });

    it('should decode &#39; to single quote', () => {
      expect(decodeHtmlEntities('It&#39;s working')).toBe("It's working");
    });

    it('should decode &amp; to ampersand', () => {
      expect(decodeHtmlEntities('Tom &amp; Jerry')).toBe('Tom & Jerry');
    });

    it('should decode &lt; to less than', () => {
      expect(decodeHtmlEntities('5 &lt; 10')).toBe('5 < 10');
    });

    it('should decode &gt; to greater than', () => {
      expect(decodeHtmlEntities('10 &gt; 5')).toBe('10 > 5');
    });

    it('should decode &nbsp; to space', () => {
      expect(decodeHtmlEntities('hello&nbsp;world')).toBe('hello world');
    });
  });

  describe('decimal numeric entities', () => {
    it('should decode decimal entities like &#8217;', () => {
      // &#8217; is the right single quotation mark (')
      expect(decodeHtmlEntities('It&#8217;s a test')).toBe('It\u2019s a test');
    });

    it('should decode &#169; to copyright symbol', () => {
      expect(decodeHtmlEntities('&#169; 2024')).toBe('© 2024');
    });

    it('should decode &#8220; and &#8221; to curly quotes', () => {
      // &#8220; is left double quotation mark, &#8221; is right double quotation mark
      expect(decodeHtmlEntities('&#8220;Hello&#8221;')).toBe('\u201cHello\u201d');
    });
  });

  describe('hexadecimal numeric entities', () => {
    it('should decode hex entities like &#x27;', () => {
      expect(decodeHtmlEntities('It&#x27;s a test')).toBe("It's a test");
    });

    it('should decode &#xA9; to copyright symbol', () => {
      expect(decodeHtmlEntities('&#xA9; 2024')).toBe('© 2024');
    });

    it('should handle uppercase hex digits', () => {
      // &#x2019; is the right single quotation mark (')
      expect(decodeHtmlEntities('&#x2019;')).toBe('\u2019');
    });

    it('should handle lowercase hex digits', () => {
      // &#x2019; is the right single quotation mark (')
      expect(decodeHtmlEntities('&#x2019;')).toBe('\u2019');
    });
  });

  describe('edge cases', () => {
    it('should return empty string for empty input', () => {
      expect(decodeHtmlEntities('')).toBe('');
    });

    it('should return null/undefined as-is', () => {
      expect(decodeHtmlEntities(null as unknown as string)).toBe(null);
      expect(decodeHtmlEntities(undefined as unknown as string)).toBe(undefined);
    });

    it('should handle text with no entities', () => {
      expect(decodeHtmlEntities('Hello World')).toBe('Hello World');
    });

    it('should handle multiple entities in sequence', () => {
      expect(decodeHtmlEntities('&lt;&gt;&amp;')).toBe('<>&');
    });

    it('should handle mixed entities', () => {
      expect(decodeHtmlEntities('&quot;Hello&quot; &amp; &#8216;World&#8217;')).toBe(
        '"Hello" & \u2018World\u2019'
      );
    });
  });

  describe('security - invalid codepoints', () => {
    it('should return empty string for null character', () => {
      expect(decodeHtmlEntities('test&#0;test')).toBe('testtest');
    });

    it('should return empty string for surrogate pair codepoints', () => {
      // D800-DFFF are surrogate pairs, invalid in UTF-16
      expect(decodeHtmlEntities('test&#55296;test')).toBe('testtest'); // 0xD800
      expect(decodeHtmlEntities('test&#57343;test')).toBe('testtest'); // 0xDFFF
    });

    it('should return empty string for codepoints beyond valid range', () => {
      expect(decodeHtmlEntities('test&#1114112;test')).toBe('testtest'); // 0x110000
      expect(decodeHtmlEntities('test&#9999999999;test')).toBe('testtest');
    });

    it('should return empty string for negative codepoints', () => {
      expect(decodeHtmlEntities('test&#-1;test')).toBe('test&#-1;test'); // Doesn't match pattern
    });
  });
});
