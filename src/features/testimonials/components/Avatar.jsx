import { initials } from '../lib/avatar';

/**
 * Small deterministic hash so each name gets its own gradient angle, the same
 * on the server and in the browser (no hydration mismatch).
 * @param {string} value
 */
const angleFor = (value) => {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.codePointAt(0)) % 360;
  return 110 + (hash % 140);
};

/**
 * Reviewer avatar: the uploaded photo when there is one, otherwise a monogram
 * of the first two letters on an Ember → Ion gradient (pure CSS, no stock
 * images).
 *
 * - With `src`: an `<img>` with a real `alt` (a photo of a person).
 * - Without: decorative (`aria-hidden`) next to a visible name, or a named
 *   image (`role="img"`) when `label` is given (the review form preview).
 *
 * @param {{
 *   name: string | null | undefined,
 *   src?: string | null,
 *   alt?: string,
 *   label?: string,
 *   size?: 'md' | 'lg',
 * }} props
 */
export function Avatar({ name, src, alt = '', label, size = 'md' }) {
  const className = size === 'lg' ? 'avatar avatar--lg' : 'avatar';
  if (src) {
    const px = size === 'lg' ? 72 : 44;
    return (
      <img
        className={`${className} avatar--photo`}
        src={src}
        alt={alt}
        width={px}
        height={px}
        loading="lazy"
        decoding="async"
      />
    );
  }
  const letters = initials(name);
  return (
    <span
      className={className}
      style={{ '--avatar-angle': `${angleFor(letters || '-')}deg` }}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true' })}
      data-empty={letters ? undefined : 'true'}
    >
      <span className="avatar__letters" aria-hidden="true">
        {letters}
      </span>
    </span>
  );
}
