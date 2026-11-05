/**
 * Finds cooking times in a step ("bake for 25 minutes", "fierbe 1 oră", "10-15 min") so Cook mode
 * can offer a timer for each. Ranges use the longer time. Works for the app's languages.
 */
export function stepDurations(step: string): number[] {
  const seconds: number[] = [];
  const pattern =
    /(\d+(?:[.,]\d+)?|½)(?:\s*½)?(?:\s*(?:-|–|to|la|à|a|bis)\s*(\d+(?:[.,]\d+)?))?\s*(?:de\s+)?(hours?|hrs?|h\b|ore|oră|ora|horas?|heures?|stunden?|std\.?|minutes?|mins?\b|min\.?|minute|minut|minutos?|minuti|minuten|seconds?|secs?\b|secunde|segundos?|secondes?|secondi|sekunden|sek\.?)/gi;
  for (const match of step.matchAll(pattern)) {
    const amount = Number((match[2] ?? match[1]).replace(',', '.').replace('½', '0.5'));
    const half = /½/.test(match[0]) && match[1] !== '½' ? 0.5 : 0;
    const unit = match[3].toLowerCase();
    const value = amount + half;
    if (!value) continue;
    const factor = /^(h|ore|oră|ora|hora|heure|stunde|std)/.test(unit)
      ? 3600
      : /^(sec|seg|sek)/.test(unit)
        ? 1
        : 60;
    const total = Math.round(value * factor);
    // Ignore oddities: under 5 seconds or over 24 hours.
    if (total >= 5 && total <= 86_400 && !seconds.includes(total)) seconds.push(total);
  }
  return seconds;
}

/** "1:30:00", "12:05", "0:45". */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const two = (n: number) => String(n).padStart(2, '0');
  return hours ? `${hours}:${two(minutes)}:${two(secs)}` : `${minutes}:${two(secs)}`;
}

/** A short label for a timer button: "25 min", "1 h 30 min", "45 s". */
export function durationLabel(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (!hours && !minutes) return `${secs} s`;
  return [hours ? `${hours} h` : '', minutes ? `${minutes} min` : ''].filter(Boolean).join(' ');
}
