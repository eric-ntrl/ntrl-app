/**
 * NTRL Index band definitions and utilities.
 *
 * Single source of truth for NTRL Index scoring bands.
 * Used by NtrlIndexGauge and NtrlIndexDetailSheet components.
 */

/**
 * NTRL Index band definition (AQI-inspired)
 */
export type NtrlIndexBand = {
  max: number;
  label: string;
  color: string;
  description: string;
};

/**
 * NTRL Index scoring bands.
 *
 * Score ranges:
 * - 0: Clean (no manipulation detected)
 * - 1-15: Low
 * - 16-35: Moderate
 * - 36-60: High
 * - 61-100: Severe
 */
export const NTRL_INDEX_BANDS: NtrlIndexBand[] = [
  { max: 0, label: 'Clean', color: '#7A9A6D', description: 'No manipulation detected' },
  { max: 15, label: 'Low', color: '#9BAB7A', description: 'Minimal manipulative language present' },
  { max: 35, label: 'Moderate', color: '#C4A855', description: 'Some manipulative patterns found' },
  { max: 60, label: 'High', color: '#B8784A', description: 'Significant manipulation detected' },
  { max: 100, label: 'Severe', color: '#9B4545', description: 'Heavy manipulation throughout' },
];

/**
 * Get the band info for a given NTRL Index score.
 *
 * @param score - NTRL Index score (0-100)
 * @returns The matching band definition
 */
export function getBandForScore(score: number): NtrlIndexBand {
  for (const band of NTRL_INDEX_BANDS) {
    if (score <= band.max) {
      return band;
    }
  }
  return NTRL_INDEX_BANDS[NTRL_INDEX_BANDS.length - 1];
}
