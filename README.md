# Sift — Intelligent GitHub Repository Search

Sift is a search engine that takes your natural language query and finds the most *relevant and well-maintained* GitHub repositories, going far beyond basic keyword matching or simply sorting by stars.

## What it does

When you search for `"cómo edito pdfs en python"`, regular GitHub search might give you tutorials, abandoned 10-year-old projects, or completely unrelated results just because they have high stars.

Sift transforms your query, intelligently retrieves candidates, extracts rich repository metadata (features), and scores them with a **deterministic ranking algorithm**. Sift evaluates:
- Is this a toy project or a robust library?
- Is it actively maintained?
- Does it have good documentation (installation, examples)?
- How widely has the community adopted it?
- Is there a high risk of abandonment?

## Architecture

1. **Query Understanding:** We parse intent, detect domain, build optimized query variants.
2. **GitHub Retrieval:** We fetch initial results from the GitHub Search API using our variants. 
3. **Feature Extraction:** We map the repository data into rich structural signals: activity, maintenance, documentation completeness, community strength, technical modernity, and risk flags.
4. **Deterministic Scoring:** The ranking engine applies transparent scoring based on weights. No hidden embeddings, no magic models that re-rank invisibly.
5. **Explanation Layer:** We construct short, human-readable explanations summarizing exactly *why* a repository ranked where it did. These explanations can optionally be polished by Gemini.
6. **UI / Debug Mode:** The React frontend displays results, comparisons, and exposes full query understanding/scoring transparently when Debug Mode is turned on.

## Scoring Formula

```typescript
total = 
  (relevance * 0.30) +
  (maintenance * 0.20) +
  (documentation * 0.15) +
  (community * 0.15) +
  (modernity * 0.10) +
  (authority * 0.10)
  - riskPenalty
```

## Optional Gemini Explanation Rewriting

Sift ranking and scoring are **always deterministic**. Gemini is completely optional and used **only** to rewrite already-factual explanations into clearer professional prose.

- Ranking, scores, and order are never affected by Gemini.
- If `GEMINI_API_KEY` is missing, deterministic explanations are always used.
- Configure `GEMINI_API_KEY` **server-side only**. Never use `NEXT_PUBLIC_GEMINI_API_KEY`.
- When enabled, the frontend asynchronously requests polished explanations for the top results after the initial search.

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## Why Sift is better than standard GitHub search

- **Does not rank only by stars.** Sift penalizes abandoned/toy repositories or "Awesome lists".
- **Understands context.** If you search for an "orm", Sift builds smart query variants.
- **Holistic ranking.** Recognizes good README documents, checks for CI and recent releases. 
- **Explainable.** The final output provides a comparison and clear breakdown of tradeoffs. Explanations are truthful by default and can be optionally polished.

## Setup

It is a Turborepo monorepo with a Next.js (App Router) application.

```bash
npm install
npm run dev
```

### GitHub Authentication

Sift works without OAuth, but the unauthenticated GitHub API is heavily rate-limited.
You can configure authenticated GitHub API requests using two methods (both optional):

#### Method 1: Server Fallback (GITHUB_TOKEN)
To increase GitHub Search rate limits for all users without OAuth:
```env
GITHUB_TOKEN=your_personal_access_token_here
```
Note: This is useful for local development or a dedicated server token.

#### Method 2: GitHub OAuth Login
Allows users to log in and use their own GitHub token to search, significantly increasing limits and personalization.

1. Create a GitHub OAuth App. (Settings -> Developer Settings -> OAuth Apps)
2. Set the Authorization callback URL to: `http://localhost:3000/api/auth/github/callback`
3. Provide the credentials in `.env`:

```env
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/github/callback
AUTH_COOKIE_SECRET=a_random_secure_32_character_string_for_encryption
```

**Security Notes:**
* You do not need to request any broad scopes (especially DO NOT request `repo`). The public repository search requires minimal permissions.
* Sift will cleanly fall back and operate anonymously if these variables are missing.
* **Never commit secrets to your repository.**

## API Examples

You can interact directly with the backend API. Append `&debug=true` to see feature extraction and scoring info.

- `/api/search?query=autenticacion%20jwt%20python&language=python&debug=true`
- `/api/search?query=como%20edito%20pdfs%20en%20python&language=python&debug=true`
- `/api/search?query=orm%20para%20python&language=python&debug=true`

### Optional Gemini Explanations Endpoint

`POST /api/explanations/gemini`

Send top repos with their deterministic explanations. Returns polished versions if `GEMINI_API_KEY` is configured.

## Known Limitations & Tradeoffs

- **GitHub API limit:** Currently, retrieving features demands multiple calls to extract a full repository view resulting in rapid rate limiting if no token is used.
- **No persistent cache:** Everything is processed live. Production requires a scalable database to cache results.
- **No embeddings yet:** The current architecture relies on text layout and matching, not deep semantic similarity of READMEs.
- **No package registry signals:** Does not yet cross-reference NPM or PyPI download metrics for absolute authority.
- **Frontend is preview-oriented:** The current UI is a demonstration. A production version should separate the backend indexing/API into a dedicated service layer away from Next.js serverless functions.

## What I would improve next

- **Cache features.** Add Redis to store repository metadata.
- **Add embeddings.** Use a Vector DB against the READMEs to understand features more deeply.
- **NPM/PyPI signals.** Cross-check against package registry stats for full ecosystem context.
- **Saved searches:** For teams sharing common tech stacks.
- **Separate Backend.** Extract the scraping logic into standard microservices using background queues rather than live serverless endpoints.
