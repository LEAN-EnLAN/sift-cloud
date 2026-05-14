import { ClassifiedDomain } from "./types.js";
import { domainSeeds } from "./domain-seeds.js";

export interface SeedSelection {
  selectedSeeds: string[];
  rejectedSeeds: string[];
  reasoning: string[];
}

export function selectSeeds(
  domain: ClassifiedDomain,
  confidence: number
): SeedSelection {
  const selectedSeeds: string[] = [];
  const rejectedSeeds: string[] = [];
  const reasoning: string[] = [];

  if (domain === "general") {
    reasoning.push("No domain detected, no seeds available.");
    return { selectedSeeds, rejectedSeeds, reasoning };
  }

  const allSeeds = domainSeeds[domain] || [];
  
  if (confidence > 0.8) {
    selectedSeeds.push(...allSeeds.slice(0, 2));
    rejectedSeeds.push(...allSeeds.slice(2));
    reasoning.push(`High confidence (${confidence}): aggressively injecting top 2 seeds.`);
  } else if (confidence > 0.4) {
    selectedSeeds.push(allSeeds[0]);
    rejectedSeeds.push(...allSeeds.slice(1));
    reasoning.push(`Medium confidence (${confidence}): injecting only top seed to avoid drift.`);
  } else {
    rejectedSeeds.push(...allSeeds);
    reasoning.push(`Low confidence (${confidence}): rejecting all seeds to prevent domination.`);
  }

  return { selectedSeeds, rejectedSeeds, reasoning };
}
