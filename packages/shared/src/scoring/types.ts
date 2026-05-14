export type RepoScore = {
  total: number;
  parts: {
    relevance: number;
    maintenance: number;
    documentation: number;
    community: number;
    modernity: number;
    authority: number;
    riskPenalty: number;
  };
  reasons: string[];
  partReasons: {
    relevance: string[];
    maintenance: string[];
    documentation: string[];
    community: string[];
    modernity: string[];
    authority: string[];
    risk: string[];
  };
  warnings: string[];
};

export type ScoredRepoResult<TRepo> = TRepo & {
  score: RepoScore;
};
