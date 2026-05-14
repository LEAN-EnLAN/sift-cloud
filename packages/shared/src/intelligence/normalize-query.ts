const SPANISH_TO_ENGLISH: Record<string, string> = {
  como: "",
  hago: "",
  hacer: "",
  editar: "edit",
  edito: "edit",
  pdfs: "pdf",
  autenticacion: "authentication",
  autenticar: "authenticate",
  contrasena: "password",
  base: "database",
  datos: "data",
  pruebas: "testing",
  probar: "testing",
  cache: "cache",
  scraping: "scraping",
  repositorio: "repository",
  libreria: "library",
  python: "python",
  node: "node",
  nodejs: "nodejs",
  javascript: "javascript",
  typescript: "typescript",
  en: "",
  para: ""
};

export function normalizeQuery(query: string): string {
  // Translate to lowercase
  let normalized = query.toLowerCase();

  // Remove accents
  normalized = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, " ").trim();

  // Strip punctuation
  normalized = normalized.replace(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g, "");

  const tokens = normalized.split(" ");
  const translatedTokens = tokens.map((token) => {
    if (Object.prototype.hasOwnProperty.call(SPANISH_TO_ENGLISH, token)) {
      return SPANISH_TO_ENGLISH[token];
    }
    return token;
  });

  return translatedTokens
    .filter((token) => token.trim().length > 0)
    .join(" ");
}
