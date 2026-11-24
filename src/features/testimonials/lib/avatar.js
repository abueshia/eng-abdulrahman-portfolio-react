/**
 * Reviewer identity helpers shared by the cards and the review form: the
 * generated monogram, plain-text display and safe avatar URLs.
 */

/**
 * Up to two letters from a name: the first letter of the first two words, or
 * the first two letters of a single word. Unicode-aware (Arabic, emoji-safe).
 * @param {string | null | undefined} name
 * @returns {string} "" when the name has no letters.
 */
export function initials(name) {
  const words = String(name ?? '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return '';
  const letters =
    words.length > 1
      ? [Array.from(words[0])[0], Array.from(words[1])[0]]
      : Array.from(words[0]).slice(0, 2);
  return letters.join('').toLocaleUpperCase();
}

/**
 * Plain text for display: drops anything that looks like a tag. React already
 * escapes text; this keeps stray markup from an API record out of sight too.
 * @param {unknown} value
 * @returns {string}
 */
export function plainText(value) {
  return String(value ?? '')
    .replace(/<\/?[a-z!][^>]*>/gi, '')
    .trim();
}

/**
 * An avatar URL that is safe to put in `src`: absolute https or root-relative.
 * @param {unknown} value
 * @returns {string | null}
 */
export function safeAvatarUrl(value) {
  if (typeof value !== 'string') return null;
  if (/^https:\/\/[^\s"'<>]+$/i.test(value)) return value;
  if (/^\/(?!\/)[^\s"'<>]*$/.test(value)) return value;
  return null;
}

/**
 * Only approved reviews are shown. Records without a status (the API lists
 * approved reviews only) count as approved; `pending` and `rejected` never
 * render, even if a response carried them by mistake.
 * @param {{ status?: string | null }} item
 */
export const isApproved = (item) => !item.status || item.status === 'approved';
