import type { RepoRiskFeatures } from "./types.js";

export function detectRiskFeatures(repo: any, readmeText: string | null): RepoRiskFeatures {
  const name = (repo.name || "").toLowerCase();
  const description = (repo.description || "").toLowerCase();
  const readmeTitle = (readmeText?.split('\\n')[0] || "").toLowerCase();
  
  const isArchived = !!repo.archived;
  const isFork = !!repo.fork;
  const isTemplate = !!repo.is_template;
  
  const isLikelyAwesomeList = 
    name.includes("awesome") || 
    description.includes("awesome list") || 
    readmeTitle.includes("awesome");

  const likelyToyKeywords = ["demo", "example", "tutorial", "sample", "practice", "playground", "starter"];
  const matchesToyKeyword = likelyToyKeywords.some(kw => name.includes(kw) || description.includes(kw));
  const starsLow = (repo.stargazers_count || 0) < 10;
  const shortReadme = !readmeText || readmeText.length < 500;
  
  const isLikelyToyProject = !!(matchesToyKeyword && (starsLow || shortReadme));

  return {
    isArchived,
    isFork,
    isTemplate,
    isLikelyAwesomeList,
    isLikelyToyProject
  };
}
