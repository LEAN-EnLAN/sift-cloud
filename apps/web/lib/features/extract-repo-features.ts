import type { RepoFeatures, RepoResult, RepoTechnicalFeatures } from "@sift/shared";
import { Octokit } from "octokit";
import { calculateDaysSince, analyzeReadme, detectRiskFeatures, detectPackageManager, analyzePackageJson } from "@sift/shared";

function getCommitDate(commit: any): string | null {
  return commit?.commit?.committer?.date || commit?.commit?.author?.date || null;
}

export async function extractFeaturesForRepo(
  github: Octokit,
  repoData: any,
  repoResult: RepoResult
): Promise<{ features: RepoFeatures; warnings: string[] }> {
  const warnings: string[] = [];
  const owner = repoData.owner.login;
  const repo = repoData.name;
  
  let lastCommitAt = repoData.updated_at || null;
  try {
     const branchStr = repoData.default_branch || "main";
     const commitRes = await github.rest.repos.getCommit({
       owner,
       repo,
       ref: branchStr
     });
     if (commitRes.data) {
       lastCommitAt = getCommitDate(commitRes.data) || lastCommitAt;
     }
  } catch {
     warnings.push("Latest commit unavailable");
  }

  const activity = {
    pushedAt: repoData.pushed_at || null,
    updatedAt: repoData.updated_at || null,
    lastCommitAt,
    daysSinceLastCommit: calculateDaysSince(lastCommitAt)
  };

  const community = {
    stars: repoData.stargazers_count || 0,
    forks: repoData.forks_count || 0,
    watchers: repoData.watchers_count || 0,
    openIssues: repoData.open_issues_count || 0
  };

  let readmeText: string | null = null;
  try {
     const readmeRes = await github.rest.repos.getReadme({
       owner,
       repo,
       mediaType: {
         format: "raw",
       },
     });
     if (typeof readmeRes.data === 'string') {
        readmeText = readmeRes.data;
     } else if ((readmeRes.data as any).content) {
        readmeText = Buffer.from((readmeRes.data as any).content, "base64").toString("utf-8");
     }
  } catch (err: any) {
     if (err.status !== 404) {
       warnings.push("README unavailable");
     } else {
       warnings.push("README not found");
     }
  }

  const docs = analyzeReadme(readmeText);
  const risk = detectRiskFeatures(repoData, readmeText);

  const maintenance = {
    hasLicense: !!repoData.license,
    license: repoData.license?.spdx_id || repoData.license?.name || null,
    releaseCount: 0,
    latestReleaseAt: null as string | null,
    contributorsCount: 0
  };

  try {
     const releasesRes = await github.rest.repos.listReleases({
       owner, repo, per_page: 10
     });
     maintenance.releaseCount = releasesRes.data.length;
     if (releasesRes.data.length > 0) {
       maintenance.latestReleaseAt = releasesRes.data[0].published_at || releasesRes.data[0].created_at || null;
     }
  } catch {
     warnings.push("Releases unavailable");
  }

  try {
     const contribsRes = await github.rest.repos.listContributors({
       owner, repo, per_page: 20
     });
     maintenance.contributorsCount = contribsRes.data.length;
  } catch {
     warnings.push("Contributors unavailable");
  }

  const technical: RepoTechnicalFeatures = {
    hasPackageJson: false,
    hasTypeScript: false,
    hasEsm: false,
    hasCi: false,
    detectedPackageManager: null
  };

  try {
    const branchStr = repoData.default_branch || "main";
    let treeSha = branchStr;
    try {
      const commitRes = await github.rest.repos.getCommit({ owner, repo, ref: branchStr });
      if (commitRes.data && commitRes.data.commit.tree.sha) {
        treeSha = commitRes.data.commit.tree.sha;
      }
    } catch {
      // Use branch name as tree_sha fallback
    }

    const treeRes = await github.rest.git.getTree({ owner, repo, tree_sha: treeSha });
    const tree = treeRes.data.tree || [];
    const files = new Set(tree.map((t: any) => t.path));

    technical.detectedPackageManager = detectPackageManager(files);

    if (files.has("package.json")) {
      technical.hasPackageJson = true;
      try {
        const pkgRes = await github.rest.repos.getContent({ owner, repo, path: "package.json" });
        if (!Array.isArray(pkgRes.data) && pkgRes.data.type === "file" && pkgRes.data.content) {
          const pkgContent = Buffer.from(pkgRes.data.content, "base64").toString("utf-8");
          const { hasEsm, hasTypeScript } = analyzePackageJson(pkgContent);
          technical.hasEsm = hasEsm;
          if (hasTypeScript) technical.hasTypeScript = true;
        }
      } catch {
        warnings.push("package.json unparseable");
      }
    }

    if (files.has("tsconfig.json")) {
      technical.hasTypeScript = true;
    }

    if (files.has(".github")) {
      try {
        const workflowsRes = await github.rest.repos.getContent({ owner, repo, path: ".github/workflows" });
        if (Array.isArray(workflowsRes.data) && workflowsRes.data.length > 0) {
          technical.hasCi = true;
        }
      } catch {
        // Not a directory or doesn't exist
      }
    }

    if (!technical.hasCi) {
      try {
         const runs = await github.rest.actions.listWorkflowRunsForRepo({ owner, repo, per_page: 1 });
         if (runs.data.total_count > 0) {
           technical.hasCi = true;
         }
      } catch (err: any) {
         if (err.status !== 404 && err.status !== 403) {
           warnings.push("CI check unavailable");
         }
      }
    }

  } catch {
    warnings.push("File tree unavailable (technical features may be missing)");
  }

  const features: RepoFeatures = {
    repoId: repoResult.id,
    fullName: repoResult.fullName,
    activity,
    community,
    docs,
    maintenance,
    technical,
    risk
  };

  return { features, warnings };
}
