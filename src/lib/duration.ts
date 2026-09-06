/** Soft dining-time hint (display only — does not block ordering). */
export const DINING_SOFT_LIMIT_MS = 2 * 60 * 60 * 1000;

export function formatDuration(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function isOverSoftLimit(ms: number) {
  return ms >= DINING_SOFT_LIMIT_MS;
}
