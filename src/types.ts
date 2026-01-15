export type Detail = {
  title: string;
  brief: string;
  full: string | null;
  disclosure: string | null;
};

export type TransparencySpan = {
  start_char: number;
  end_char: number;
  original_text: string;
  action: string;
  reason: string;
  replacement_text: string | null;
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
  has_manipulative_content: boolean; // Whether content was modified by NTRL
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
