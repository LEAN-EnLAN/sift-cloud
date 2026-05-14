export type LibraryLikeness = {
  score: number;
  positiveSignals: string[];
  negativeSignals: string[];
};

const POSITIVE = ["library", "package", "toolkit", "module", "client", "parser", "processor", "sdk", "implementation"];
const NEGATIVE = ["tutorial", "demo", "example", "starter", "sample", "course", "book", "full-stack", "fullstack", "clone", "playground", "project"];

export function computeLibraryLikeness(name: string, description: string, readme: string | null): LibraryLikeness {
  const text = `${name} ${description} ${readme || ""}`.toLowerCase();
  const positiveSignals: string[] = [];
  const negativeSignals: string[] = [];

  for (const p of POSITIVE) {
    if (text.includes(p)) positiveSignals.push(p);
  }
  for (const n of NEGATIVE) {
    if (text.includes(n)) negativeSignals.push(n);
  }

  let score = 50;
  score += positiveSignals.length * 8;
  score -= negativeSignals.length * 12;

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    positiveSignals,
    negativeSignals
  };
}
