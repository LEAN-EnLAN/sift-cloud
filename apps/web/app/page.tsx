'use client';

import { useState, useEffect } from 'react';
import { renderMarkdown, type ExplainedRepoResult, type RepoComparison } from '@sift/shared';
import { Search, Loader2, ExternalLink, Bug, FileText, Check, Github } from 'lucide-react';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('');
  const [results, setResults] = useState<ExplainedRepoResult[]>([]);
  const [comparison, setComparison] = useState<RepoComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [authStatus, setAuthStatus] = useState<any>(null);

  useEffect(() => {
    // Check auth status
    fetch('/api/auth/status')
      .then(res => res.json())
      .then(data => setAuthStatus(data))
      .catch(console.error);

    // Handle auth errors from callback
    const searchParams = new URLSearchParams(window.location.search);
    const authError = searchParams.get('auth_error');
    if (authError) {
      if (authError === 'oauth_not_configured') setError('GitHub OAuth is not configured on the server.');
      else if (authError === 'invalid_state') setError('Invalid OAuth state. Please try again.');
      else if (authError === 'missing_code') setError('GitHub login cancelled or code missing.');
      else if (authError === 'token_exchange_failed') setError('Failed to exchange token with GitHub. Please try again.');
      else setError(`Authentication error: ${authError}`);
      
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    const authSuccess = searchParams.get('auth');
    if (authSuccess === 'github_connected') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);
    setDebugInfo(null);

    try {
      const params = new URLSearchParams();
      params.append('query', query.trim());
      if (language.trim()) params.append('language', language.trim());
      if (debugMode) params.append('debug', 'true');

      const res = await fetch(`/api/search?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response received:', text);
        throw new Error(`Server returned an unexpected response format (${res.status}). Please try again later.`);
      }

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error?.message || data.error || 'Failed to perform search.');
      }
      
      setResults(data.repos || []);
      setComparison(data.comparison || null);
      if (data.understanding || data.debug) setDebugInfo({ ...data.understanding, ...data.debug });
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070908] text-zinc-300 font-sans selection:bg-[#22F5A7]/20 selection:text-[#22F5A7] relative bg-dot-grid">
      <div className="absolute top-0 right-0 p-4 md:p-6 z-10 flex items-center justify-between w-full pointer-events-none">
        <div className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase pointer-events-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22F5A7] animate-pulse"></span>
            CLI Companion
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          {authStatus && (
            <div className="flex items-center gap-3 mr-2 bg-[#111412] border border-[#1F2622] rounded-sm px-3 py-1.5 text-xs font-mono">
              {authStatus.loggedIn ? (
                <>
                  <span className="text-[#22F5A7] flex items-center gap-1"><Github className="w-3.5 h-3.5"/> Connected</span>
                  <a href="/api/auth/logout" className="text-zinc-500 hover:text-zinc-300">Logout</a>
                </>
              ) : authStatus.oauthConfigured ? (
                <a href="/api/auth/github/login" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Github className="w-3.5 h-3.5"/>
                  Connect GitHub
                </a>
              ) : (
                <span className="text-zinc-500" title="OAuth missing in server environment">GitHub OAuth not configured</span>
              )}
            </div>
          )}
          <button
            onClick={() => setDebugMode(!debugMode)}
            className={`p-1.5 rounded-sm border transition-colors flex items-center space-x-2 text-xs font-mono ${
              debugMode 
                ? 'bg-[#111412] border-[#22F5A7]/50 text-[#22F5A7]' 
                : 'bg-[#111412]/50 border-[#1F2622] text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
            }`}
            title="Toggle Debug Mode"
          >
            <Bug className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Debug Mode</span>
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-12 p-6 md:p-12 pt-24">
        <header className="space-y-4 text-left">
          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4">
            <span className="text-[#22F5A7]">● live</span>
            <span className="text-zinc-700">/</span>
            <span>deterministic scoring</span>
            <span className="text-zinc-700">/</span>
            <span>github api</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-zinc-100">
            Sift Cloud
          </h1>
          <p className="text-zinc-400 text-sm md:text-base font-mono max-w-xl">
            Natural language in. Ranked open-source signal out.
          </p>
        </header>

        <div>
          <form onSubmit={handleSearch} className="group relative flex flex-col gap-3 w-full">
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex bg-[#111412] border border-[#1F2622] rounded-sm focus-within:border-[#22F5A7]/50 focus-within:ring-1 focus-within:ring-[#22F5A7]/10 transition-all shadow-sm">
                  <div className="flex items-center pl-4 pr-2 text-[#22F5A7] font-mono text-sm pointer-events-none">$ sift search</div>
                  <input
                    type="text"
                    placeholder='"How do I edit PDFs in Python?"'
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-transparent py-3 px-2 text-zinc-100 placeholder:text-zinc-600 focus:outline-none font-mono text-sm"
                    autoFocus
                  />
                </div>
                <div className="w-full sm:w-[200px] flex bg-[#111412] border border-[#1F2622] rounded-sm focus-within:border-[#22F5A7]/50 focus-within:ring-1 focus-within:ring-[#22F5A7]/10 transition-all shadow-sm">
                  <div className="flex items-center pl-4 pr-1 text-zinc-500 font-mono text-xs pointer-events-none">--lang</div>
                  <input
                    type="text"
                    placeholder="python"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-transparent py-3 px-2 text-zinc-100 placeholder:text-zinc-600 focus:outline-none font-mono text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="flex items-center justify-center bg-[#22F5A7] text-[#070908] rounded-sm px-6 py-3 font-medium hover:bg-[#22F5A7]/90 focus:outline-none focus:ring-2 focus:ring-[#22F5A7]/50 focus:ring-offset-2 focus:ring-offset-[#070908] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-mono text-sm"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Execute'}
                </button>
            </div>
          </form>
          
          <div className="flex flex-wrap items-center gap-2 mt-4 text-[10px] font-mono text-zinc-500">
            <span className="text-zinc-600">Examples:</span>
            <button type="button" onClick={() => { setQuery('JWT auth in Python'); setLanguage('python'); }} className="px-2 py-1 rounded-sm border border-[#1F2622] bg-[#111412] hover:text-zinc-300 hover:border-zinc-700 transition-colors">"JWT auth in Python"</button>
            <button type="button" onClick={() => { setQuery('Edit PDFs in Python'); setLanguage('python'); }} className="px-2 py-1 rounded-sm border border-[#1F2622] bg-[#111412] hover:text-zinc-300 hover:border-zinc-700 transition-colors">"Edit PDFs in Python"</button>
            <button type="button" onClick={() => { setQuery('ORM for Python'); setLanguage('python'); }} className="px-2 py-1 rounded-sm border border-[#1F2622] bg-[#111412] hover:text-zinc-300 hover:border-zinc-700 transition-colors">"ORM for Python"</button>
          </div>

          <div className="mt-8 border-l-2 border-[#1F2622] pl-4 py-1 flex flex-col gap-2">
            <div className="font-mono text-xs text-zinc-500">
              <span className="text-[#22F5A7] opacity-60">$</span> sift search "{query || '...'}" {language && `--language ${language} `}--top 10
              <br/>
              <span className="text-zinc-600 mt-1 block">ranking candidates · extracting signals · exporting markdown</span>
            </div>
            {authStatus && (
              <div className="font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
                 {authStatus.loggedIn ? (
                   <span className="text-[#22F5A7]">Auth: GitHub Connected</span>
                 ) : authStatus.tokenSourceAvailable?.envGithubToken ? (
                   <span className="text-teal-500">Auth: Env Token</span>
                 ) : (
                   <span className="text-amber-500/70">Auth: Anonymous (Rate Limited)</span>
                 )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 pt-4">
          {error && (
            <div className="p-4 border border-red-900/50 bg-[#111412] text-red-400 rounded-sm text-sm font-mono tracking-wide">
              {error}
            </div>
          )}

          {hasSearched && !loading && !error && comparison && (
            <div className="p-4 border border-[#1F2622] bg-[#111412] rounded-sm text-sm mb-6 flex flex-col sm:flex-row gap-4 font-mono">
              <div className="flex-shrink-0 text-[#22F5A7] font-semibold uppercase tracking-wider text-[10px] sm:w-24 pt-1">Analysis</div>
              <div className="space-y-3">
                <p className="text-zinc-300 leading-relaxed text-xs">{comparison.summary}</p>
                {comparison.tradeoffs.length > 0 && (
                  <ul className="space-y-1.5 text-zinc-400 text-xs">
                    {comparison.tradeoffs.map((t, i) => (
                      <li key={i} className="flex gap-2"><span className="text-zinc-600">→</span> <span>{t}</span></li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {debugMode && debugInfo && !loading && (
            <div className="p-5 border border-[#1F2622] bg-[#111412] text-zinc-300 rounded-sm text-sm overflow-x-auto space-y-6 font-mono mb-6">
              <div className="flex space-x-2 text-zinc-100 pb-2 border-b border-zinc-700/60">
                <Bug className="w-4 h-4" />
                <span className="font-semibold text-xs tracking-wider uppercase">Query Understanding & Extraction</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase font-bold block mb-1">Domain</span>
                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                    <span className="px-2 py-0.5 bg-[#070908] border border-[#1F2622] rounded-sm font-medium whitespace-nowrap">
                      {debugInfo.domain}
                    </span>
                    <span className="text-zinc-500 line-clamp-1">conf: {debugInfo.classification?.confidence?.toFixed(2)}</span>
                  </div>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase font-bold block mb-1">Normalized</span>
                  <span className="text-zinc-300">&quot;{debugInfo.normalized}&quot;</span>
                </div>
              </div>

              <div>
                <span className="text-zinc-500 text-[10px] uppercase font-bold block mb-1">Weighted Keywords</span>
                <div className="flex flex-wrap gap-1.5">
                  {debugInfo.weightedKeywords?.map((k: any, i: number) => (
                    <span key={i} className={`px-1.5 py-0.5 rounded-sm text-[10px] border flex items-center space-x-1 ${k.weight >= 0.8 ? 'bg-[#22F5A7]/10 text-[#22F5A7] border-[#22F5A7]/30' : k.weight >= 0.4 ? 'bg-[#070908] text-zinc-300 border-[#1F2622]' : 'bg-[#111412] text-zinc-500 border-[#1F2622] border-dashed'}`}>
                      <span>{k.keyword}</span>
                      <span className="opacity-50 text-[10px]">({k.weight})</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#1F2622] pt-4 border-dashed">
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase font-bold block mb-1">Selected Seeds</span>
                  <div className="flex flex-wrap gap-1.5">
                    {debugInfo.selectedSeeds?.length ? debugInfo.selectedSeeds.map((k: string, i: number) => (
                      <span key={i} className="px-1.5 py-0.5 bg-[#070908] text-zinc-300 rounded-sm text-xs border border-[#1F2622]">
                        {k}
                      </span>
                    )) : <span className="text-zinc-600 text-xs">None</span>}
                  </div>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase font-bold block mb-1">Rejected Seeds</span>
                  <div className="flex flex-wrap gap-1.5">
                    {debugInfo.rejectedSeeds?.length ? debugInfo.rejectedSeeds.map((k: string, i: number) => (
                      <span key={i} className="px-1.5 py-0.5 bg-[#070908]/50 text-zinc-500 rounded-sm text-xs border border-[#1F2622] line-through">
                        {k}
                      </span>
                    )) : <span className="text-zinc-600 text-xs">None</span>}
                  </div>
                </div>
              </div>

              {(debugInfo.lexicalWarnings?.length > 0) && (
                <div className="border-t border-[#1F2622] pt-4 border-dashed">
                  <span className="text-zinc-500 text-[10px] uppercase font-bold block mb-2">Lexical & Injection Warnings</span>
                  <ul className="space-y-1 text-xs text-yellow-500/70">
                    {debugInfo.lexicalWarnings.map((w: string, i: number) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t border-[#1F2622] pt-4 border-dashed">
                <span className="text-zinc-500 text-[10px] uppercase font-bold block mb-2">Scored Variants</span>
                <ul className="space-y-2">
                  {debugInfo.variants?.map((v: any, i: number) => (
                    <li key={i} className="p-2 bg-[#111412] rounded-sm border border-[#1F2622] text-xs">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <span className="text-zinc-300 font-medium break-all">{v.query}</span>
                        <span className={`px-1.5 py-0.5 rounded-sm font-mono shrink-0 border ${v.score >= 1.0 ? 'bg-zinc-800 text-zinc-200 border-zinc-700' : 'bg-[#070908] text-zinc-500 border-[#1F2622]'}`}>
                          {v.score?.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {v.reasons.map((r: string, idx: number) => (
                          <span key={idx} className={`text-[10px] ${r.startsWith('Bonus') ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            {r}
                          </span>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {debugInfo.featureExtraction && (
                <div className="border-t border-[#1F2622] pt-4 border-dashed">
                  <span className="text-zinc-500 text-[10px] uppercase font-bold block mb-2">Feature Extraction Status</span>
                  <div className="flex gap-4 text-xs font-mono">
                    <span className="text-zinc-300">Enriched: {debugInfo.featureExtraction.enrichedCount}</span>
                    <span className="text-zinc-300">Failed: {debugInfo.featureExtraction.failedCount}</span>
                    {debugInfo.rateLimit?.hit && (
                      <span className="text-yellow-500/80 font-medium">Rate Limit Hit ({debugInfo.rateLimit.status})</span>
                    )}
                  </div>
                </div>
              )}
            </div>

          )}

          {loading && !error && (
             <div className="flex flex-col items-center justify-center py-20 space-y-4 text-zinc-400">
               <Loader2 className="w-5 h-5 animate-spin" />
               <p className="text-sm font-medium">Searching GitHub and extracting repository signals...</p>
             </div>
          )}

          {!loading && hasSearched && results.length === 0 && !error && (
             <div className="py-20 text-center text-zinc-500 font-mono text-sm border border-[#1F2622] bg-[#111412] rounded-sm border-dashed">
               <p>No strong repositories found. Try a broader query or remove filters.</p>
             </div>
          )}

          {!loading && results.map((repo, index) => (
            <div
              key={repo.id}
              className="group flex flex-col p-4 sm:p-6 rounded-sm border border-[#1F2622] bg-[#111412] hover:border-zinc-700 transition-all font-mono"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="space-y-3 flex-grow min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <span className="text-[#22F5A7] text-sm tabular-nums">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      {repo.owner?.avatarUrl ? (
                         <img src={repo.owner.avatarUrl} alt="" className="w-5 h-5 rounded-sm bg-[#1F2622]" onError={(e) => e.currentTarget.style.display = 'none'} />
                      ) : (
                         <div className="w-5 h-5 flex-shrink-0 rounded-sm bg-[#1F2622] flex items-center justify-center text-[10px] text-zinc-500">{repo.owner?.login?.[0]?.toUpperCase() || '?'}</div>
                      )}
                      <a href={repo.url} target="_blank" rel="noopener noreferrer" className="text-zinc-100 text-base font-medium hover:underline decoration-[#22F5A7] decoration-2 transition-colors truncate flex items-center gap-2">
                        <span className="truncate"><span className="text-zinc-500 font-normal">{repo.owner?.login || repo.fullName.split('/')[0]}/</span>{repo.name || repo.fullName.split('/')[1]}</span>
                        <ExternalLink className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                      </a>
                    </div>
                  </div>
                  {repo.description && (
                    <p className="text-zinc-400 text-xs sm:text-sm pl-8 line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                  {repo.explanation && (
                    <div className="pl-8 mt-2 space-y-2">
                      <div className="text-xs text-zinc-300 bg-[#070908]/50 p-3 rounded-sm border border-[#1F2622]">
                        <span className="text-zinc-500 block mb-1">why:</span>
                        <span className="block mb-2">{repo.explanation.short}</span>
                        {repo.explanation.bullets.length > 0 && (
                           <ul className="text-zinc-400 space-y-1 mt-2">
                             {repo.explanation.bullets.slice(0, 3).map((b, idx) => (
                               <li key={idx} className="flex items-start gap-1.5"><span className="text-zinc-600">·</span> {b}</li>
                             ))}
                           </ul>
                        )}
                      </div>
                      {repo.explanation.caveats.length > 0 && (
                        <div className="text-xs text-amber-500/80 mt-2 flex items-center gap-1.5">
                          <span className="shrink-0 text-amber-500/50">⚠</span> {repo.explanation.caveats[0]}
                        </div>
                      )}
                      {(repo.explanation as any)?.isGemini !== undefined && (
                        <div className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1 opacity-60">
                           <span className="w-1.5 h-1.5 rounded-full bg-[#22F5A7]/40"></span> 
                           {(repo.explanation as any).isGemini ? "Explanation rewritten with Gemini" : "Deterministic explanation"}
                        </div>
                      )}
                    </div>
                  )}
                  {!repo.explanation && repo.score?.reasons && repo.score.reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 pl-8">
                      {repo.score.reasons.slice(0, 2).map((reason: string, idx: number) => (
                        <span key={idx} className="text-[10px] bg-[#070908] text-zinc-400 max-w-max px-2 py-0.5 rounded-sm border border-[#1F2622]">
                          ✓ {reason}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                {repo.score && (
                  <div className="flex-shrink-0 flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1 w-full sm:w-auto p-3 sm:p-0 bg-[#070908] sm:bg-transparent border sm:border-0 border-[#1F2622] rounded-sm sm:rounded-none">
                    <div className={`text-[10px] uppercase tracking-widest font-mono font-medium ${
                        repo.score.total >= 80 ? 'text-[#22F5A7]' :
                        repo.score.total >= 60 ? 'text-teal-400' :
                        repo.score.total >= 40 ? 'text-amber-500' :
                        'text-zinc-500'
                      }`}>
                        {repo.score.total >= 80 ? 'Strong match' :
                         repo.score.total >= 60 ? 'Good candidate' :
                         repo.score.total >= 40 ? 'Needs review' :
                         'Weak match'}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-zinc-500 text-xs">score</span>
                      <span className={`text-xl font-medium ${
                        repo.score.total >= 80 ? 'text-zinc-100' :
                        repo.score.total >= 60 ? 'text-zinc-200' :
                        repo.score.total >= 40 ? 'text-zinc-300' :
                        'text-zinc-500'
                      }`}>
                        {repo.score.total.toFixed(0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-zinc-400 mt-4 pl-8 pt-3 border-t border-[#1F2622] border-dashed">
                <div className="flex items-center space-x-1">
                  <span className="text-zinc-600">★</span>
                  <span className="text-zinc-300">{repo.stars.toLocaleString()}</span>
                </div>
                {(repo.features?.community?.forks ?? 0) > 0 && (
                  <div className="flex items-center space-x-1">
                    <span className="text-zinc-600">forks:</span>
                    <span>{repo.features.community.forks.toLocaleString()}</span>
                  </div>
                )}
                {repo.language && (
                  <div className="flex items-center space-x-1">
                    <span className="text-zinc-600">lang:</span>
                    <span>{repo.language}</span>
                  </div>
                )}
                {repo.features?.maintenance?.license && (
                  <div className="flex items-center space-x-1">
                    <span className="text-zinc-600">lic:</span>
                    <span>{repo.features.maintenance.license}</span>
                  </div>
                )}
                {repo.features?.activity?.daysSinceLastCommit != null && (
                  <div className="flex items-center space-x-1">
                    <span className="text-zinc-600">upd:</span>
                    <span>{repo.features.activity.daysSinceLastCommit === 0 ? 'today' : `${repo.features.activity.daysSinceLastCommit}d ago`}</span>
                  </div>
                )}
              </div>

              {repo.features && (
                <div className="flex flex-wrap gap-1 mt-3 pl-8">
                  {repo.features.documentation?.hasReadme && <span className="px-1.5 py-0.5 bg-[#070908] border border-[#1F2622] text-zinc-500 text-[9px] uppercase tracking-wider rounded-sm">README</span>}
                  {repo.features.documentation?.hasExamples && <span className="px-1.5 py-0.5 bg-[#070908] border border-[#1F2622] text-zinc-500 text-[9px] uppercase tracking-wider rounded-sm">Examples</span>}
                  {repo.features.documentation?.hasInstallation && <span className="px-1.5 py-0.5 bg-[#070908] border border-[#1F2622] text-zinc-500 text-[9px] uppercase tracking-wider rounded-sm">Install</span>}
                  {repo.features.maintenance?.hasCI && <span className="px-1.5 py-0.5 bg-[#070908] border border-[#1F2622] text-zinc-500 text-[9px] uppercase tracking-wider rounded-sm">CI</span>}
                  
                  {repo.features.risk?.isArchived && <span className="px-1.5 py-0.5 bg-red-950/30 border border-red-900/50 text-red-400 text-[9px] uppercase tracking-wider rounded-sm">Archived</span>}
                  {repo.features.risk?.isTemplate && <span className="px-1.5 py-0.5 bg-yellow-950/30 border border-yellow-900/50 text-yellow-500 text-[9px] uppercase tracking-wider rounded-sm">Template</span>}
                </div>
              )}

              <details className={`mt-4 pl-8 pt-3 cursor-pointer group/details outline-none w-full border-t border-[#1F2622] border-dashed ${debugMode ? 'open' : ''}`} onClick={(e) => { if (!debugMode) { e.preventDefault(); e.currentTarget.open = !e.currentTarget.open; } }}>
                <summary className={`text-[10px] text-zinc-500 font-mono hover:text-[#22F5A7] uppercase tracking-wider transition-colors list-none flex items-center gap-1 w-max ${debugMode ? 'hidden' : ''}`}>
                  <span className="group-open/details:hidden flex items-center gap-1"><span>+</span> Details & Breakdown </span>
                  <span className="hidden group-open/details:flex items-center gap-1"><span>-</span> Hide details</span>
                </summary>
                <div className={`mt-3 pt-3 text-xs cursor-default ${!debugMode ? '' : 'mt-0 pt-0'}`}>
                  {repo.retrievalMetadata && (
                    <div className="mb-4">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold mb-2 tracking-wide font-mono block">Retrieval Provenance</span>
                      <span className="text-zinc-400 text-xs">Found by {repo.retrievalMetadata.variantCount} query variant(s)</span>
                      {repo.retrievalMetadata.matchedVariants?.length > 0 && (
                        <ul className="mt-1.5 space-y-1 text-zinc-500 font-mono text-[10px]">
                          {repo.retrievalMetadata.matchedVariants.slice(0, 3).map((v: string, i: number) => (
                            <li key={i}>$ sift search "{v}"</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  {repo.score && (
                    <div className="flex flex-col gap-3 w-full">
                      <div>
                        <div className="text-[10px] text-zinc-500 uppercase font-bold mb-2 tracking-wide font-mono">Score Breakdown</div>
                         <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 text-[10px]">
                           {Object.entries(repo.score.parts).map(([key, val]) => (
                              <div key={key} className="p-1.5 bg-[#070908] rounded-sm border border-[#1F2622] text-center flex flex-col">
                                <span className="text-zinc-500 mb-1 font-mono uppercase truncate">{key.substring(0, 4)}</span>
                                <span className={`font-mono ${key === 'riskPenalty' && (val as number) > 0 ? 'text-amber-500' : 'text-zinc-300'}`}>{(() => {
                                  let v = val as number;
                                  if (Object.is(v, -0)) v = 0;
                                  if (key === 'riskPenalty' && v > 0) return `-${v.toFixed(1).replace('.0', '')}`;
                                  return Number.isInteger(v) ? v : v.toFixed(1);
                                })()}</span>
                              </div>
                           ))}
                         </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4 w-full">
                        {repo.score?.partReasons && Object.values(repo.score.partReasons).some(arr => Array.isArray(arr) && arr.length > 0) && (
                          <div className="flex-1">
                             <div className="text-[10px] text-zinc-500 uppercase font-bold mb-2 tracking-wide font-mono mt-2">Part Reasons</div>
                             <ul className="text-[10px] text-zinc-400 space-y-1.5 font-mono">
                               {Object.entries((repo.score as any).partReasons).map(([category, reasons]) => 
                                 Array.isArray(reasons) && reasons.length > 0 && (
                                   <li key={category} className="flex gap-2">
                                     <span className="text-[#22F5A7] w-16 shrink-0">{category}:</span>
                                     <div className="flex flex-col gap-0.5">
                                       {(reasons as string[]).map((r, i) => <span key={i}>{r}</span>)}
                                     </div>
                                   </li>
                                 )
                               )}
                             </ul>
                          </div>
                        )}
                        
                        {repo.score?.warnings && repo.score.warnings.length > 0 && (
                          <div className="flex-1">
                             <div className="text-[10px] text-zinc-500 uppercase font-bold mb-2 tracking-wide font-mono mt-2 flex items-center gap-1">Signals <Bug className="w-3 h-3"/></div>
                             <ul className="text-[10px] text-amber-500/80 space-y-1 font-mono">
                               {repo.score.warnings.map((w, i) => (
                                 <li key={i}>! {w}</li>
                               ))}
                             </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </details>
            </div>
          ))}
        </div>

        <div className="pt-10 pb-4">
            {results.length > 0 && !loading && (
              <div className="border border-[#1F2622] rounded-sm bg-[#111412] font-mono">
                <div className="flex items-center justify-between p-3 border-b border-[#1F2622] bg-[#070908]">
                  <div className="text-[10px] uppercase tracking-widest text-[#22F5A7]">
                    Export / Markdown
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                       const md = renderMarkdown(query, language, results, comparison || undefined);
                       try {
                         await navigator.clipboard.writeText(md);
                         setCopied(true);
                         setTimeout(() => setCopied(false), 2000);
                       } catch (err) {
                         console.error('Failed to copy text: ', err);
                         alert('Failed to copy to clipboard. Check console for details.');
                       }
                    }}
                    className="flex items-center space-x-2 px-3 py-1 bg-[#1F2622] hover:bg-zinc-700 text-zinc-300 text-[10px] uppercase tracking-wider rounded-sm transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-[#22F5A7]" /> : <FileText className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-4 text-xs text-zinc-500">
                  <p>Use this markdown block in README examples, issues, or delivery notes.</p>
                </div>
              </div>
            )}
        </div>

        <footer className="pt-8 pb-6 border-t border-[#1F2622] flex justify-between items-center text-[10px] text-zinc-500 font-mono tracking-wider uppercase">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22F5A7]" />
              <span>Frontend Ready</span>
            </div>
            <a href="/api/health" target="_blank" className="hover:text-zinc-300 transition-colors border-b border-transparent hover:border-zinc-300 pb-0.5">
              API Status
            </a>
          </div>
          <div className="text-zinc-600">v1.0.0-delivery</div>
        </footer>
      </div>
    </main>
  );
}
