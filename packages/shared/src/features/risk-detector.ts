import type { RepoRiskFeatures } from "./types.js";

export function detectRiskFeatures(repo: any, readmeText: string | null): RepoRiskFeatures {
  const name = (repo.name || "").toLowerCase();
  const description = (repo.description || "").toLowerCase();
  const readme = (readmeText || "").toLowerCase();
  
  const isArchived = !!repo.archived;
  const isFork = !!repo.fork;
  const isTemplate = !!repo.is_template;
  
  const isLikelyAwesomeList = 
    name.includes("awesome") || 
    description.includes("awesome list") || 
    readme.includes("awesome");

  const tutorialKeywords = [
    "tutorial", "demo", "example", "sample", "practice", "playground",
    "starter", "course", "book", "companion", "clone", "fullstack", "full-stack",
    "frontend", "backend", "react", "angular", "svelte", "project"
  ];

  const isTutorialLike = tutorialKeywords.some(kw => 
    name.includes(kw) || description.includes(kw) || readme.includes(kw)
  );

  const starsLow = (repo.stargazers_count || 0) < 10;
  const shortReadme = !readmeText || readmeText.length < 500;
  
  const isLikelyToyProject = !!(isTutorialLike && (starsLow || shortReadme));

  return {
    isArchived,
    isFork,
    isTemplate,
    isLikelyAwesomeList,
    isLikelyToyProject,
    isTutorial: isTutorialLike
  };
}
