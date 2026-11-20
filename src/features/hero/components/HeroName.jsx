/**
 * The name: the page's `<h1>` and its LCP element. Rendered as plain text in
 * the prerendered HTML so it paints immediately and is fully indexable.
 *
 * Depth sandwich: the first line sits BEHIND the portrait (z 1) and the
 * second line IN FRONT of it (z 3), with the portrait (z 2) between them, so
 * the head rises in front of the name while the outlined surname crosses
 * the body. That only works because the `<h1>` itself creates no stacking
 * context: never transform/fade the `<h1>`; animate its lines instead.
 *
 * The surname is outlined by an SVG filter (see styles/hero.css), which
 * stays seam-free on variable fonts and on joined Arabic letters.
 *
 * Lines are keyed by locale: the hero director splits them into characters
 * (English) or words (Arabic, never characters: that would break letter
 * joining). Keying makes React replace the split DOM on a language switch
 * instead of patching nodes it no longer owns.
 *
 * @param {{ first?: string, last?: string, locale: string }} props
 */
export function HeroName({ first, last, locale }) {
  return (
    <h1 id="hero-title" className="hero-name">
      <span
        key={`first-${locale}`}
        className="hero-name__line hero-name__line--first"
        data-line="first"
      >
        {first}
      </span>{' '}
      <span
        key={`last-${locale}`}
        className="hero-name__line hero-name__line--last"
        data-line="last"
        data-text={last}
      >
        <span className="hero-name__ink">{last}</span>
      </span>
    </h1>
  );
}
