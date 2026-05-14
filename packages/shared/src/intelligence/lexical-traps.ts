import { ClassifiedDomain } from "./types.js";

const traps: Record<string, string[]> = {
  pdf: ["editor", "editing", "editorjs", "vscode", "markdown"],
  orm: ["generator", "visualizer", "gui"],
  "jwt-auth": ["tutorial", "example", "learn"],
  testing: ["tutorial", "course", "learn"],
};

export function filterLexicalTraps(
  words: string[], 
  domain: ClassifiedDomain,
  confidence: number
): { filtered: string[], warnings: string[] } {
  const domainTraps = domain !== "general" ? (traps[domain] || []) : [];
  const warnings: string[] = [];
  
  const filtered = words.filter(word => {
    if (domainTraps.includes(word)) {
      if (confidence < 0.5) {
        warnings.push(`Kept trap '${word}' due to low domain confidence (${confidence})`);
        return true; 
      } else {
        warnings.push(`Removed trap '${word}' (confidence: ${confidence})`);
        return false;
      }
    }
    return true;
  });

  return { filtered, warnings };
}
