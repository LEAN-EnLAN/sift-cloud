import { NextResponse } from 'next/server';
import { SearchQuerySchema } from '@sift/shared';
import { buildQueryVariants } from '@sift/shared';
import { scoreRepo, type ScoredRepoResult, SCORING_WEIGHTS, MAX_RISK_PENALTY, explainRepo, compareRepos } from '@sift/shared';
import { mapRepo } from '../../../lib/map-repo';
import { extractFeaturesForRepo } from '../../../lib/features/extract-repo-features';
import { getGithubAuthInfo } from '../../../lib/github/get-github-auth-token';
import { Octokit } from 'octokit';

export const runtime = "nodejs";

const MAX_ENRICHED_REPOS_NORMAL = 5;
const MAX_ENRICHED_REPOS_DEBUG = 10;
const SEARCH_RESULTS_PER_VARIANT = 8;
const MAX_VARIANTS_TO_SEARCH = 4;
const FEATURE_EXTRACTION_CONCURRENCY = 2;

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      try {
        const value = await mapper(items[index]);
        results[index] = { status: 'fulfilled', value };
      } catch (reason) {
        results[index] = { status: 'rejected', reason };
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const queryParam = searchParams.get('query');
  const languageParam = searchParams.get('language') || undefined;
  const debug = searchParams.get('debug') === 'true';

  const parsed = SearchQuerySchema.safeParse({
    query: queryParam,
    language: languageParam,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { query, language } = parsed.data;

  const understanding = buildQueryVariants({ query, language });

  try {
    const allResults = new Map();
    const rawRepoDataMap = new Map();

    const authInfo = await getGithubAuthInfo();
    const github = new Octokit({
      auth: authInfo.token || undefined,
    });

    let rateLimitInfo = {
      hit: false,
      status: 200,
      message: ""
    };

    const variantsToSearch = understanding.variants.slice(0, MAX_VARIANTS_TO_SEARCH);

    for (const variant of variantsToSearch) {
      try {
        const response = await github.rest.search.repos({
          q: variant.query,
          per_page: SEARCH_RESULTS_PER_VARIANT,
        });

        const results = response.data.items.map(mapRepo);
        for (let i = 0; i < results.length; i++) {
          const repo = results[i];
          const rawRepoData = response.data.items[i];
          
          if (!rawRepoDataMap.has(repo.id)) {
            rawRepoDataMap.set(repo.id, rawRepoData);
          }

          if (!allResults.has(repo.id)) {
            allResults.set(repo.id, {
               ...repo,
               retrievalMetadata: {
                 matchedVariants: [variant.query],
                 variantCount: 1
               }
            });
          } else {
            const existing = allResults.get(repo.id);
            if (!existing.retrievalMetadata.matchedVariants.includes(variant.query)) {
              existing.retrievalMetadata.matchedVariants.push(variant.query);
              existing.retrievalMetadata.variantCount++;
            }
          }
        }
      } catch (githubErr: any) {
        console.error(`GitHub API returned error for query variant "${variant.query}":`, githubErr.message);
        if (githubErr.status === 403 || githubErr.status === 429) {
            console.error('Rate limit reached or missing token.');
            rateLimitInfo = {
              hit: true,
              status: githubErr.status,
              message: githubErr.message
            };
            if (allResults.size === 0) {
              const msg = !!authInfo.token 
                ? 'GitHub rate limit reached for this account. Try again later.' 
                : 'GitHub rate limit reached. Connect GitHub or configure GITHUB_TOKEN to continue.';
              return NextResponse.json({ error: msg }, { status: 429 });
            }
            break; // Stop searching variants if rate limited
        }
      }
    }

    let mergedResults = Array.from(allResults.values());
    mergedResults.sort((a, b) => b.retrievalMetadata.variantCount - a.retrievalMetadata.variantCount);

    const enrichLimit = debug ? MAX_ENRICHED_REPOS_DEBUG : MAX_ENRICHED_REPOS_NORMAL;
    mergedResults = mergedResults.slice(0, enrichLimit);
    
    let enrichedCount = 0;
    let failedCount = 0;

    if (!rateLimitInfo.hit) {
      await mapWithConcurrency(
        mergedResults,
        FEATURE_EXTRACTION_CONCURRENCY,
        async (repoResult) => {
          const rawRepoData = rawRepoDataMap.get(repoResult.id);
          if (!rawRepoData) return;
          
          try {
            const { features, warnings } = await extractFeaturesForRepo(github, rawRepoData, repoResult);
            repoResult.features = features;
            repoResult.featureWarnings = warnings;
            enrichedCount++;
          } catch (err: any) {
            failedCount++;
            repoResult.featureWarnings = repoResult.featureWarnings || [];
            if (err.status === 403 || err.status === 429) {
              rateLimitInfo.hit = true;
              rateLimitInfo.status = err.status;
              rateLimitInfo.message = "Rate limit hit during enrichment";
              repoResult.featureWarnings.push("Rate limited during extraction");
              throw err; // bubble up so others might stop if we wanted, but mapWithConcurrency catches it.
            } else {
              repoResult.featureWarnings.push(`Extraction failed: ${err.message}`);
            }
          }
        }
      );
    } else {
      // If we already hit rate limit, let's just add a warning to the ones we couldn't enrich
      for (const repoResult of mergedResults) {
        repoResult.featureWarnings = repoResult.featureWarnings || [];
        repoResult.featureWarnings.push("Skipped extraction due to rate limits");
      }
    }

    const scoredRepos: ScoredRepoResult<any>[] = mergedResults.map((repo) => {
      const score = scoreRepo({
        repo,
        understanding,
        requestedLanguage: language
      });
      return { ...repo, score };
    });

    scoredRepos.sort((a, b) => b.score.total - a.score.total);

    const explainedRepos = scoredRepos.map(repo => {
      try {
        const explanation = explainRepo(repo, understanding);
        return { ...repo, explanation };
      } catch (e) {
        return { ...repo, explanation: { short: "Explanation failed", bullets: [], caveats: [] } };
      }
    });

    let comparison = undefined;
    try {
      if (explainedRepos.length > 0) {
        comparison = compareRepos(explainedRepos);
      }
    } catch (e) {}

    if (debug) {
      return NextResponse.json({ 
        understanding,
        comparison,
        debug: {
          featureExtraction: {
            enrichedCount,
            failedCount,
            auth: {
              source: authInfo.source,
              authenticated: !!authInfo.token
            },
            warnings: explainedRepos.flatMap(r => r.featureWarnings || [])
          },
          scoring: {
            weights: { ...SCORING_WEIGHTS, riskPenalty: -MAX_RISK_PENALTY },
            rankedCount: explainedRepos.length
          },
          rateLimit: rateLimitInfo.hit ? rateLimitInfo : undefined
        },
        repos: explainedRepos 
      });
    }

    return NextResponse.json({ comparison, repos: explainedRepos });
  } catch (error: unknown) {
    console.error('GitHub API error:', error);
    return NextResponse.json({ error: 'Failed to fetch results from GitHub' }, { status: 500 });
  }
}
