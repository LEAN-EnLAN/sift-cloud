export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function roundScore(value: number): number {
  return Math.round(value * 10) / 10;
}

export function logScale(value: number, maxReference: number): number {
  if (value <= 0) return 0;
  const maxLog = Math.log(maxReference);
  const valLog = Math.log(value);
  return clamp((valLog / maxLog) * 100, 0, 100);
}

export function recencyScore(days: number): number {
  if (days < 0) return 0;
  if (days <= 30) return 100;
  if (days <= 90) return 90;
  if (days <= 180) return 75;
  if (days <= 365) return 50;
  if (days <= 730) return 25;
  return 0;
}

export function booleanScore(value: boolean, points: number): number {
  return value ? points : 0;
}
