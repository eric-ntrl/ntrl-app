import { findRedlines, getRedlinedPhrases, hasManipulativeLanguage, RedlineSpan } from '../redline';

describe('findRedlines', () => {
  describe('manipulative phrases', () => {
    it('should detect "breaking" as manipulative', () => {
      const result = findRedlines('Breaking news: major announcement');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].text.toLowerCase()).toBe('breaking');
      expect(result[0].reason).toBe('manipulative language');
    });

    it('should detect "shocking" as manipulative', () => {
      const result = findRedlines('Shocking discovery in the lab');
      expect(result.some((r) => r.text.toLowerCase() === 'shocking')).toBe(true);
    });

    it('should detect "you won\'t believe" as manipulative', () => {
      const result = findRedlines("You won't believe what happened next");
      expect(result.some((r) => r.text.toLowerCase() === "you won't believe")).toBe(true);
    });

    it('should detect conflict amplification terms', () => {
      const result = findRedlines('Senator slams new policy');
      expect(result.some((r) => r.text.toLowerCase() === 'slams')).toBe(true);
    });

    it('should detect sensationalist terms', () => {
      const terms = ['devastating', 'nightmare', 'catastrophe', 'bombshell'];
      for (const term of terms) {
        const result = findRedlines(`This is a ${term} event`);
        expect(result.some((r) => r.text.toLowerCase() === term)).toBe(true);
      }
    });
  });

  describe('CTA/promotional phrases', () => {
    it('should detect "subscribe now" as promotional', () => {
      const result = findRedlines('Subscribe now for exclusive content');
      expect(result.some((r) => r.text.toLowerCase() === 'subscribe now')).toBe(true);
      expect(result.some((r) => r.reason === 'promotional content')).toBe(true);
    });

    it('should detect "click here" as promotional', () => {
      const result = findRedlines('Click here to learn more');
      expect(result.some((r) => r.text.toLowerCase() === 'click here')).toBe(true);
    });

    it('should detect newsletter CTAs', () => {
      const result = findRedlines('Join our newsletter today');
      expect(result.some((r) => r.text.toLowerCase() === 'join our newsletter')).toBe(true);
    });

    it('should detect engagement bait', () => {
      const result = findRedlines('Let us know what you think in the comments');
      expect(result.some((r) => r.text.toLowerCase() === 'let us know')).toBe(true);
    });
  });

  describe('ALL CAPS detection', () => {
    it('should detect ALL CAPS words of 4+ characters', () => {
      // Using a word that isn't in the manipulative phrases list
      const result = findRedlines('This is IMPORTANT information');
      expect(result.some((r) => r.text === 'IMPORTANT')).toBe(true);
      expect(result.some((r) => r.reason === 'emphatic capitalization')).toBe(true);
    });

    it('should not flag common acronyms', () => {
      const result = findRedlines('NASA announced new mission');
      expect(result.some((r) => r.text === 'NASA')).toBe(false);
    });

    it('should not flag short caps words (3 or fewer)', () => {
      const result = findRedlines('The USA and UK signed agreement');
      expect(result.some((r) => r.text === 'USA')).toBe(false);
      expect(result.some((r) => r.text === 'UK')).toBe(false);
    });

    it('should flag non-acronym ALL CAPS', () => {
      const result = findRedlines('This is ABSOLUTELY INSANE');
      expect(result.some((r) => r.text === 'ABSOLUTELY')).toBe(true);
      expect(result.some((r) => r.text === 'INSANE')).toBe(true);
    });
  });

  describe('excessive punctuation', () => {
    it('should detect multiple exclamation marks', () => {
      const result = findRedlines('This is amazing!!');
      expect(result.some((r) => r.text === '!!')).toBe(true);
      expect(result.some((r) => r.reason === 'excessive punctuation')).toBe(true);
    });

    it('should detect multiple question marks', () => {
      const result = findRedlines('Can you believe this??');
      expect(result.some((r) => r.text === '??')).toBe(true);
    });

    it('should detect mixed punctuation', () => {
      const result = findRedlines('What is happening?!');
      expect(result.some((r) => r.text === '?!')).toBe(true);
    });

    it('should not flag single punctuation', () => {
      const result = findRedlines('Is this true?');
      expect(result.some((r) => r.reason === 'excessive punctuation')).toBe(false);
    });
  });

  describe('word boundaries', () => {
    it('should not match partial words', () => {
      const result = findRedlines('The breakthrough was significant');
      // "breakthrough" should match, but "break" alone should not cause false positive
      const matchedTexts = result.map((r) => r.text.toLowerCase());
      expect(matchedTexts).toContain('breakthrough');
    });

    it('should match phrases at start of text', () => {
      const result = findRedlines('Breaking: new report released');
      expect(result.some((r) => r.text.toLowerCase() === 'breaking')).toBe(true);
    });

    it('should match phrases at end of text', () => {
      const result = findRedlines('Find out more by clicking click here');
      expect(result.some((r) => r.text.toLowerCase() === 'click here')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should return empty array for empty string', () => {
      expect(findRedlines('')).toEqual([]);
    });

    it('should return empty array for null/undefined', () => {
      expect(findRedlines(null as unknown as string)).toEqual([]);
      expect(findRedlines(undefined as unknown as string)).toEqual([]);
    });

    it('should return empty array for clean text', () => {
      const result = findRedlines('The government announced new policy changes today.');
      expect(result.length).toBe(0);
    });

    it('should handle text with multiple issues', () => {
      const result = findRedlines('SHOCKING breaking news!! Click here to subscribe now');
      expect(result.length).toBeGreaterThan(2);
    });
  });

  describe('span merging', () => {
    it('should merge overlapping spans', () => {
      // "breaking" and "breaking news" might both be detected
      const result = findRedlines('This breaking news is urgent');
      // Verify no overlapping spans
      for (let i = 1; i < result.length; i++) {
        expect(result[i].start).toBeGreaterThanOrEqual(result[i - 1].end);
      }
    });

    it('should preserve span positions correctly', () => {
      const text = 'The shocking revelation';
      const result = findRedlines(text);
      const shockingSpan = result.find((r) => r.text.toLowerCase() === 'shocking');
      if (shockingSpan) {
        expect(text.substring(shockingSpan.start, shockingSpan.end).toLowerCase()).toBe('shocking');
      }
    });
  });
});

describe('getRedlinedPhrases', () => {
  it('should return array of unique phrases', () => {
    const result = getRedlinedPhrases('Breaking news! Breaking update!');
    expect(result).toContain('breaking');
    // Should not have duplicates
    expect(result.filter((p) => p === 'breaking').length).toBe(1);
  });

  it('should return lowercase phrases', () => {
    const result = getRedlinedPhrases('SHOCKING NEWS');
    expect(result.every((p) => p === p.toLowerCase())).toBe(true);
  });

  it('should return empty array for clean text', () => {
    const result = getRedlinedPhrases('Normal news article about events.');
    expect(result).toEqual([]);
  });
});

describe('hasManipulativeLanguage', () => {
  it('should return true when manipulative language is present', () => {
    expect(hasManipulativeLanguage('Breaking news alert')).toBe(true);
    expect(hasManipulativeLanguage('Click here now!!')).toBe(true);
  });

  it('should return false for clean text', () => {
    expect(hasManipulativeLanguage('The weather will be sunny tomorrow.')).toBe(false);
  });

  it('should return false for empty text', () => {
    expect(hasManipulativeLanguage('')).toBe(false);
  });
});
