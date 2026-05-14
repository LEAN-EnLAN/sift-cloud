import type { RepoDocsFeatures } from "./types.js";

export function analyzeReadme(readmeText: string | null): RepoDocsFeatures {
  if (!readmeText) {
    return {
      hasReadme: false,
      readmeLength: 0,
      hasInstallationSection: false,
      hasUsageSection: false,
      hasExamples: false,
      hasBadges: false
    };
  }

  const lowercaseReadme = readmeText.toLowerCase();

  const installationKeywords = ["installation", "install", "getting started", "setup"];
  const hasInstallationSection = installationKeywords.some(kw => lowercaseReadme.includes(kw));

  const usageKeywords = ["usage", "example", "quickstart", "how to use"];
  const hasUsageSection = usageKeywords.some(kw => lowercaseReadme.includes(kw));

  const exampleKeywords = ["```", "example"];
  const hasExamples = exampleKeywords.some(kw => lowercaseReadme.includes(kw));

  const badgeKeywords = ["badge", "shields.io", "!["];
  const hasBadges = badgeKeywords.some(kw => lowercaseReadme.includes(kw));

  return {
    hasReadme: true,
    readmeLength: readmeText.length,
    hasInstallationSection,
    hasUsageSection,
    hasExamples,
    hasBadges
  };
}
