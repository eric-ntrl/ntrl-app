export type Detail = {
  what_happened: string;
  why_it_matters: string;
  known: string[];
  uncertain: string[];
  removed?: string[];
};

export type Item = {
  id: string;
  source: string;
  source_url?: string; // Canonical source homepage (fallback)
  published_at: string;
  headline: string;
  summary: string;
  url: string; // Article URL (may 404)
  original_text?: string; // Original article text before neutralization
  detail: Detail;
};

export type Section = {
  key: string;
  title: string;
  items: Item[];
};

export type Brief = {
  generated_at: string;
  sections: Section[];
};
