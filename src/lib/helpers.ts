/**
 * Shared helper utilities used across the application.
 */

/** Extract up to 2 initials from a full name. */
export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/** Trim a numeric string to its finite value, returning the original if not a number. */
export function trimNumber(value: string): string {
  const number = Number(value);
  return Number.isFinite(number) ? String(number) : value;
}

/** Format a number to 2 decimal places. */
export function fmt(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}
