import type { RepoTechnicalFeatures } from "./types.js";

export function detectPackageManager(files: Set<string>): RepoTechnicalFeatures["detectedPackageManager"] {
  if (files.has("pnpm-lock.yaml")) {
    return "pnpm";
  } else if (files.has("yarn.lock")) {
    return "yarn";
  } else if (files.has("bun.lockb") || files.has("bun.lock")) {
    return "bun";
  } else if (files.has("package-lock.json")) {
    return "npm";
  }
  return null;
}

export function analyzePackageJson(pkgContent: string): { hasEsm: boolean; hasTypeScript: boolean } {
  let hasEsm = false;
  let hasTypeScript = false;
  
  try {
    const pkgJson = JSON.parse(pkgContent);
    if (pkgJson.type === "module") {
      hasEsm = true;
    }
    const allDeps = {
      ...(pkgJson.dependencies || {}),
      ...(pkgJson.devDependencies || {})
    };
    if (allDeps["typescript"]) {
      hasTypeScript = true;
    }
  } catch {
    // Ignore JSON parse errors
  }
  
  return { hasEsm, hasTypeScript };
}
