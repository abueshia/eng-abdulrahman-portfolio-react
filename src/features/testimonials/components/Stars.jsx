export const STAR_POINTS =
  '12 2.5 14.9 8.6 21.5 9.4 16.6 14 17.9 20.6 12 17.3 6.1 20.6 7.4 14 2.5 9.4 9.1 8.6';

/**
 * A star outline (filled when `on`), decorative.
 * @param {{ on?: boolean }} props
 */
export function StarIcon({ on = false }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" data-on={on ? 'true' : 'false'}>
      <polygon points={STAR_POINTS} strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Read-only rating: five SVG stars announced as one image ("Rated 4 out of
 * 5"). Shown on cards only: ratings are never emitted as structured data
 * (no Review / AggregateRating JSON-LD).
 * @param {{ value: number, label: string }} props
 */
export function Stars({ value, label }) {
  return (
    <span className="stars" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} on={n <= value} />
      ))}
    </span>
  );
}
