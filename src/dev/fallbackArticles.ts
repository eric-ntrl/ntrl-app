/**
 * TEMPORARY: Fallback articles for dev UI testing.
 * Remove once backend is connected.
 *
 * DEV_ONLY: These are realistic placeholder headlines used when
 * RSS fetching fails. Timestamps are generated dynamically to
 * always appear as "recent" (within the last 24 hours).
 */

import type { Item } from '../types';

/**
 * Generate a timestamp N hours ago from now
 */
function hoursAgo(hours: number): string {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
}

/**
 * Generate fallback articles with dynamic timestamps
 * These will always pass the 24h recency filter
 */
export function getFallbackArticles(): Item[] {
  return [
    {
      id: 'fallback-001',
      source: 'Reuters',
      source_url: 'https://www.reuters.com',
      published_at: hoursAgo(2),
      headline: 'International summit addresses trade policy framework',
      summary:
        'Representatives from multiple nations met to discuss proposed changes to trade agreements. Discussions are ongoing with no final decisions announced.',
      url: 'https://www.reuters.com',
      original_text:
        'In a major development, world leaders gathered for critical talks on sweeping trade reforms that could reshape the global economy.',
      detail: {
        title: 'International summit addresses trade policy framework',
        brief:
          'Officials from several countries held discussions on trade policy at an international summit. Trade policy changes can affect import/export costs and economic relationships between nations.',
        full: null,
        disclosure: 'Language adjusted for clarity.',
      },
      has_manipulative_content: true,
    },
    {
      id: 'fallback-002',
      source: 'AP News',
      source_url: 'https://apnews.com',
      published_at: hoursAgo(4),
      headline: 'Central bank releases quarterly economic assessment',
      summary:
        'The latest economic report shows mixed indicators across different sectors. Officials noted both areas of stability and sectors requiring monitoring.',
      url: 'https://apnews.com',
      original_text:
        'The central bank shocked markets with its sobering assessment, warning of turbulent times ahead as inflation fears grip the economy.',
      detail: {
        title: 'Central bank releases quarterly economic assessment',
        brief:
          'The central bank published its quarterly report on economic conditions. The assessment includes sector-by-sector analysis and may influence future monetary policy decisions.',
        full: null,
        disclosure: 'Language adjusted for clarity.',
      },
      has_manipulative_content: true,
    },
    {
      id: 'fallback-003',
      source: 'BBC',
      source_url: 'https://www.bbc.com',
      published_at: hoursAgo(6),
      headline: 'Regional infrastructure project moves to planning phase',
      summary:
        'A proposed transportation project has received initial approval to begin detailed planning. Environmental and community impact assessments will follow.',
      url: 'https://www.bbc.com',
      original_text:
        'A groundbreaking infrastructure project promises to revolutionize regional transport, with officials hailing it as a game-changer for local communities.',
      detail: {
        title: 'Regional infrastructure project moves to planning phase',
        brief:
          'A regional transportation project received approval to proceed to planning. Environmental and community impact assessments will follow before construction can begin.',
        full: null,
        disclosure: 'Language adjusted for clarity.',
      },
      has_manipulative_content: true,
    },
    {
      id: 'fallback-004',
      source: 'NPR',
      source_url: 'https://www.npr.org',
      published_at: hoursAgo(8),
      headline: 'Technology companies report quarterly performance figures',
      summary:
        'Several major technology firms released earnings data. Results varied across companies with some exceeding expectations while others reported lower figures.',
      url: 'https://www.npr.org',
      original_text:
        'Tech giants stunned Wall Street with explosive earnings that crushed analyst expectations, sending stocks soaring in after-hours trading.',
      detail: {
        title: 'Technology companies report quarterly performance figures',
        brief:
          'Multiple technology companies published their quarterly financial results. Results varied across companies, with some exceeding expectations while others reported lower figures.',
        full: null,
        disclosure: 'Language adjusted for clarity.',
      },
      has_manipulative_content: true,
    },
    {
      id: 'fallback-005',
      source: 'Bloomberg',
      source_url: 'https://www.bloomberg.com',
      published_at: hoursAgo(10),
      headline: 'Energy sector sees shifts in production patterns',
      summary:
        'Production data from the energy sector shows changing patterns in output. Analysts are monitoring these trends for potential market implications.',
      url: 'https://www.bloomberg.com',
      original_text:
        'The energy sector is in turmoil as dramatic production swings threaten to upend markets and send prices spiraling.',
      detail: {
        title: 'Energy sector sees shifts in production patterns',
        brief:
          'Energy production data shows shifts in output patterns across the sector. Analysts are monitoring these trends for potential effects on prices and supply.',
        full: null,
        disclosure: 'Language adjusted for clarity.',
      },
      has_manipulative_content: true,
    },
    {
      id: 'fallback-006',
      source: 'Reuters',
      source_url: 'https://www.reuters.com',
      published_at: hoursAgo(12),
      headline: 'Healthcare research consortium publishes study findings',
      summary:
        'A multi-institution research project released findings from a recent study. The researchers noted both promising results and areas requiring further investigation.',
      url: 'https://www.reuters.com',
      original_text:
        'A breakthrough medical study offers hope to millions, with researchers claiming stunning results that could transform treatment forever.',
      detail: {
        title: 'Healthcare research consortium publishes study findings',
        brief:
          'Researchers from multiple institutions published findings from a collaborative healthcare study. The results show both promising areas and aspects requiring further investigation.',
        full: null,
        disclosure: 'Language adjusted for clarity.',
      },
      has_manipulative_content: true,
    },
    {
      id: 'fallback-007',
      source: 'AP News',
      source_url: 'https://apnews.com',
      published_at: hoursAgo(14),
      headline: 'Legislative committee advances policy proposal',
      summary:
        'A committee vote moved a policy proposal to the next stage of review. Additional hearings and amendments are expected before final consideration.',
      url: 'https://apnews.com',
      original_text:
        'In a shocking turn, the committee rammed through the controversial bill despite fierce opposition from critics who warn of dire consequences.',
      detail: {
        title: 'Legislative committee advances policy proposal',
        brief:
          'A legislative committee voted to advance a policy proposal to the next stage of review. Additional hearings and potential amendments are expected before any final consideration.',
        full: null,
        disclosure: 'Language adjusted for clarity.',
      },
      has_manipulative_content: true,
    },
    {
      id: 'fallback-008',
      source: 'BBC',
      source_url: 'https://www.bbc.com',
      published_at: hoursAgo(16),
      headline: 'Weather patterns affect agricultural regions',
      summary:
        'Recent weather conditions have impacted farming areas in several regions. Agricultural officials are assessing effects on current growing seasons.',
      url: 'https://www.bbc.com',
      original_text:
        'Extreme weather devastates farming communities as desperate farmers face catastrophic losses that threaten their livelihoods.',
      detail: {
        title: 'Weather patterns affect agricultural regions',
        brief:
          'Weather conditions affected agricultural areas in multiple regions. Officials are currently assessing the extent of the impact on crops and farming operations.',
        full: null,
        disclosure: 'Language adjusted for clarity.',
      },
      has_manipulative_content: true,
    },
  ];
}
