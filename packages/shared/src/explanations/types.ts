export type RepoExplanation = {
  short: string;
  bullets: string[];
  caveats: string[];
};

export type RepoComparison = {
  summary: string;
  strongest: string | null;
  tradeoffs: string[];
};
