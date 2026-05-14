'use client';

import { useState, useEffect } from 'react';
import { type ExplainedRepoResult } from '@sift/shared';
import { Search, Loader2, ExternalLink, Github, AlertCircle } from 'lucide-react';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('');
  const [results, setResults] = useState<ExplainedRepoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [authStatus, setAuthStatus] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/status')
      .then(res => res.json())
      .then(data => setAuthStatus(data))
      .catch(console.error);

    const searchParams = new URLSearchParams(window.location.search);
    const authError = searchParams.get('auth_error');
    if (authError) {
      if (authError === 'oauth_not_configured') setError('OAuth de GitHub no está configurado en el servidor.');
      else if (authError === 'invalid_state') setError('Estado de OAuth inválido. Por favor intenta de nuevo.');
      else if (authError === 'missing_code') setError('Inicio de sesión en GitHub cancelado o falta el código.');
      else if (authError === 'token_exchange_failed') setError('Fallo al obtener el token de GitHub. Por favor intenta de nuevo.');
      else setError(`Error de autenticación: ${authError}`);
      
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

    try {
      const params = new URLSearchParams();
      params.append('query', query.trim());
      if (language.trim()) params.append('language', language.trim());

      const res = await fetch(`/api/search?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`El servidor devolvió un formato inesperado (${res.status}). Por favor, inténtalo de nuevo más tarde.`);
      }

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error?.message || data.error || 'Fallo al realizar la búsqueda.');
      }
      
      const searchResults = data.repos || [];
      setResults(searchResults);
    } catch (err: any) {
      setError(err.message || 'Ha ocurrido un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const programmingLanguages = [
    { value: '', label: 'Todos los lenguajes' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'c++', label: 'C++' },
    { value: 'c#', label: 'C#' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'php', label: 'PHP' },
  ];

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Buscador de Repositorios
            </h1>
            <p className="text-gray-500 mt-1">Explora proyectos open-source de GitHub</p>
          </div>
          
          <div className="flex flex-col items-end">
            {authStatus && (
              <>
                {authStatus.loggedIn ? (
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-600 flex items-center gap-1 text-sm font-medium">
                      <Github className="w-4 h-4"/> Conectado
                    </span>
                    <a href="/api/auth/logout" className="text-sm text-gray-500 hover:text-gray-900 underline">Cerrar sesión</a>
                  </div>
                ) : (
                  <a 
                    href="/api/auth/github/login" 
                    className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm font-medium"
                  >
                    <Github className="w-4 h-4"/>
                    Obtener token de GitHub
                  </a>
                )}
                {!authStatus.loggedIn && (
                  <span className="text-xs text-gray-400 mt-1 max-w-[200px] text-right">
                    Conéctate para buscar con mayores límites locales
                  </span>
                )}
              </>
            )}
          </div>
        </header>

        <form onSubmit={handleSearch} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="¿Qué estás buscando? Ej: JWT auth..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div className="md:w-64">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-700"
              >
                {programmingLanguages.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="flex items-center justify-center bg-emerald-600 text-white px-8 py-3 rounded-md font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buscar'}
            </button>
          </div>
        </form>

        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-600" />
              <p>Buscando repositorios...</p>
            </div>
          )}

          {!loading && hasSearched && results.length === 0 && !error && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
              <p>No se encontraron resultados para esta búsqueda.</p>
            </div>
          )}

          {!loading && results.map((repo, index) => (
            <div key={repo.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <a href={repo.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-lg font-semibold text-emerald-700 hover:text-emerald-800 hover:underline">
                    {repo.fullName}
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </a>
                  {repo.description && (
                    <p className="text-gray-600 mt-2 text-sm leading-relaxed">
                      {repo.description}
                    </p>
                  )}
                  {repo.explanation && repo.explanation.short && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-100">
                      <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-2">
                         {(repo.explanation as any)?.isGemini ? "Gemini explanation" : "Deterministic explanation"}
                      </div>
                      <p className="text-sm text-gray-700">{repo.explanation.short}</p>
                    </div>
                  )}
                </div>
                {repo.score && (
                  <div className="flex flex-col items-end shrink-0 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Puntuación</span>
                    <span className="text-2xl font-bold text-gray-900">{repo.score.total.toFixed(0)}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-gray-100 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <span className="text-yellow-400 text-lg">★</span>
                  <span>{repo.stars.toLocaleString()} estrellas</span>
                </div>
                {repo.language && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <span>{repo.language}</span>
                  </div>
                )}
                {repo.features?.activity?.daysSinceLastCommit != null && (
                  <div className="flex items-center gap-1.5">
                    <span>Actualizado {repo.features.activity.daysSinceLastCommit === 0 ? 'hoy' : `hace ${repo.features.activity.daysSinceLastCommit} días`}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
