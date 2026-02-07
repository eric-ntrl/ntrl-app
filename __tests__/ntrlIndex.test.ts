import { NTRL_INDEX_BANDS, getBandForScore, NtrlIndexBand } from '../src/utils/ntrlIndex';

describe('NTRL Index Bands', () => {
  describe('getBandForScore', () => {
    it('score 0 should be "Clean"', () => {
      expect(getBandForScore(0).label).toBe('Clean');
    });

    it('score 1 should be "Low"', () => {
      expect(getBandForScore(1).label).toBe('Low');
    });

    it('score 15 should be "Low"', () => {
      expect(getBandForScore(15).label).toBe('Low');
    });

    it('score 16 should be "Moderate"', () => {
      expect(getBandForScore(16).label).toBe('Moderate');
    });

    it('score 22 should be "Moderate"', () => {
      // This was the bug - score 22 showed different labels in different components
      expect(getBandForScore(22).label).toBe('Moderate');
    });

    it('score 35 should be "Moderate"', () => {
      expect(getBandForScore(35).label).toBe('Moderate');
    });

    it('score 36 should be "High"', () => {
      expect(getBandForScore(36).label).toBe('High');
    });

    it('score 60 should be "High"', () => {
      expect(getBandForScore(60).label).toBe('High');
    });

    it('score 61 should be "Severe"', () => {
      expect(getBandForScore(61).label).toBe('Severe');
    });

    it('score 100 should be "Severe"', () => {
      expect(getBandForScore(100).label).toBe('Severe');
    });

    it('bands should cover full 0-100 range', () => {
      for (let i = 0; i <= 100; i++) {
        const band = getBandForScore(i);
        expect(band).toBeDefined();
        expect(band.label).toBeDefined();
        expect(band.color).toBeDefined();
        expect(band.description).toBeDefined();
      }
    });

    it('out-of-range scores should return last band', () => {
      expect(getBandForScore(101).label).toBe('Severe');
      expect(getBandForScore(150).label).toBe('Severe');
    });

    it('negative scores should return first band', () => {
      expect(getBandForScore(-1).label).toBe('Clean');
      expect(getBandForScore(-100).label).toBe('Clean');
    });
  });

  describe('NTRL_INDEX_BANDS', () => {
    it('should have 5 bands', () => {
      expect(NTRL_INDEX_BANDS).toHaveLength(5);
    });

    it('bands should be in ascending order by max', () => {
      for (let i = 1; i < NTRL_INDEX_BANDS.length; i++) {
        expect(NTRL_INDEX_BANDS[i].max).toBeGreaterThan(NTRL_INDEX_BANDS[i - 1].max);
      }
    });

    it('last band should have max of 100', () => {
      expect(NTRL_INDEX_BANDS[NTRL_INDEX_BANDS.length - 1].max).toBe(100);
    });

    it('first band should have max of 0 (Clean only for score 0)', () => {
      expect(NTRL_INDEX_BANDS[0].max).toBe(0);
      expect(NTRL_INDEX_BANDS[0].label).toBe('Clean');
    });

    it('all bands should have required properties', () => {
      for (const band of NTRL_INDEX_BANDS) {
        expect(typeof band.max).toBe('number');
        expect(typeof band.label).toBe('string');
        expect(typeof band.color).toBe('string');
        expect(typeof band.description).toBe('string');
        expect(band.color).toMatch(/^#[0-9A-Fa-f]{6}$/); // Valid hex color
      }
    });
  });

  describe('Band boundary tests', () => {
    // Test all boundaries to ensure no gaps
    const expectedBands: { score: number; label: string }[] = [
      { score: 0, label: 'Clean' },
      { score: 1, label: 'Low' },
      { score: 15, label: 'Low' },
      { score: 16, label: 'Moderate' },
      { score: 35, label: 'Moderate' },
      { score: 36, label: 'High' },
      { score: 60, label: 'High' },
      { score: 61, label: 'Severe' },
      { score: 100, label: 'Severe' },
    ];

    expectedBands.forEach(({ score, label }) => {
      it(`score ${score} should be "${label}"`, () => {
        expect(getBandForScore(score).label).toBe(label);
      });
    });
  });
});
