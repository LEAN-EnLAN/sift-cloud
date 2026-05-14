export function calculateDaysSince(dateString: string | null): number | null {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    const diffMs = Date.now() - date.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}
