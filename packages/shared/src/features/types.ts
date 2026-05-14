export type RepoActivityFeatures = {
  pushedAt: string | null;
  updatedAt: string | null;
  lastCommitAt: string | null;
  daysSinceLastCommit: number | null;
};

export type RepoCommunityFeatures = {
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
};

export type RepoDocsFeatures = {
  hasReadme: boolean;
  readmeLength: number;
  hasInstallationSection: boolean;
  hasUsageSection: boolean;
  hasExamples: boolean;
  hasBadges: boolean;
};

export type RepoMaintenanceFeatures = {
  hasLicense: boolean;
  license: string | null;
  releaseCount: number;
  latestReleaseAt: string | null;
  contributorsCount: number;
};

export type RepoTechnicalFeatures = {
  hasPackageJson: boolean;
  hasTypeScript: boolean;
  hasEsm: boolean;
  hasCi: boolean;
  detectedPackageManager: "npm" | "pnpm" | "yarn" | "bun" | null;
};

export type RepoRiskFeatures = {
  isArchived: boolean;
  isFork: boolean;
  isTemplate: boolean;
  isLikelyToyProject: boolean;
  isLikelyAwesomeList: boolean;
  isTutorial?: boolean;
};

export type RepoFeatures = {
  repoId: number;
  fullName: string;
  activity: RepoActivityFeatures;
  community: RepoCommunityFeatures;
  docs: RepoDocsFeatures;
  maintenance: RepoMaintenanceFeatures;
  technical: RepoTechnicalFeatures;
  risk: RepoRiskFeatures;
};
