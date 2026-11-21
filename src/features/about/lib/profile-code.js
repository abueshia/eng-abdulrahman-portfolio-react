/**
 * The engineer profile as a real PHP 8.3 class (readonly promoted properties,
 * a backed enum, a fluent build pipeline), generated from API data so the
 * card can never drift from the profile it describes.
 *
 * Output is pre-tokenised (no runtime highlighter, identical in Node and the
 * browser). Every line carries a `key` linking it to the prose: when the
 * reader reaches the paragraph about tests, the `->test()` line lights up.
 */

/**
 * @typedef {'kw' | 'ty' | 'fn' | 'str' | 'num' | 'var' | 'cm' | 'en' | 'p'} TokenKind
 * @typedef {[TokenKind, string]} Token
 * @typedef {{ key: string | null, tokens: Token[] }} CodeLine
 */

/** Line keys the prose can light up. */
export const LINE_KEYS = Object.freeze([
  'class',
  'stack',
  'years',
  'company',
  'design',
  'solid',
  'test',
  'ship',
]);

/** Story paragraph → code line (by position: journey, principles, today). */
export const STORY_LINES = Object.freeze(['years', 'solid', 'stack']);

/** Principle (by `key`) → code line. */
export const PRINCIPLE_LINES = Object.freeze({
  architecture: 'design',
  solid: 'solid',
  tests: 'test',
});

/** @param {string} key e.g. "backend" → "Backend" */
const caseName = (key) =>
  key
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');

/** @param {string} value PHP single-quoted string literal. */
const str = (value) => `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/**
 * @param {{
 *   stack?: Array<{ key: string, value: string }>,
 *   years?: number,
 *   company?: { name?: string, role?: string } | null,
 *   timezone?: string,
 * }} profile
 * @returns {CodeLine[]}
 */
export function buildProfileCode({ stack = [], years, company, timezone }) {
  /** @type {CodeLine[]} */
  const lines = [];
  const line = (/** @type {string | null} */ key, /** @type {Token[]} */ ...tokens) =>
    lines.push({ key, tokens });
  const blank = () => line(null);
  const I1 = '    ';
  const I2 = I1 + I1;
  const I3 = I2 + I1;

  line(null, ['kw', '<?php']);
  blank();
  line(null, ['fn', 'declare'], ['p', '(strict_types='], ['num', '1'], ['p', ');']);
  blank();
  line(null, ['kw', 'namespace '], ['ty', 'App\\Engineers'], ['p', ';']);
  blank();

  if (stack.length > 0) {
    const width = Math.max(...stack.map((item) => caseName(item.key).length));
    line('stack', ['kw', 'enum '], ['ty', 'Stack'], ['p', ': '], ['kw', 'string']);
    line('stack', ['p', '{']);
    for (const item of stack) {
      const name = caseName(item.key);
      line(
        'stack',
        ['p', I1],
        ['kw', 'case '],
        ['en', name.padEnd(width)],
        ['p', ' = '],
        ['str', str(item.value)],
        ['p', ';'],
      );
    }
    line('stack', ['p', '}']);
    blank();
  }

  line(
    'class',
    ['kw', 'final class '],
    ['ty', 'AbdulrahmanAbuEisha'],
    ['kw', ' implements '],
    ['ty', 'Engineer'],
  );
  line('class', ['p', '{']);
  line(null, ['p', I1], ['kw', 'public function '], ['fn', '__construct'], ['p', '(']);
  if (Number.isFinite(years)) {
    line(
      'years',
      ['p', I2],
      ['kw', 'public readonly int '],
      ['var', '$yearsShipping'],
      ['p', ' = '],
      ['num', String(years)],
      ['p', ','],
    );
  }
  if (company?.name) {
    line(
      'company',
      ['p', I2],
      ['kw', 'public readonly string '],
      ['var', '$company'],
      ['p', ' = '],
      ['str', str(company.name)],
      ['p', ','],
      ...(company.role ? /** @type {Token[]} */ ([['cm', ` // ${company.role}`]]) : []),
    );
  }
  if (timezone) {
    line(
      null,
      ['p', I2],
      ['kw', 'public readonly string '],
      ['var', '$timezone'],
      ['p', ' = '],
      ['str', str(timezone)],
      ['p', ','],
    );
  }
  line(null, ['p', `${I1}) {}`]);
  blank();
  line(
    null,
    ['p', I1],
    ['kw', 'public function '],
    ['fn', 'build'],
    ['p', '('],
    ['ty', 'Requirement '],
    ['var', '$need'],
    ['p', '): '],
    ['ty', 'System'],
  );
  line(null, ['p', `${I1}{`]);
  line(
    'design',
    ['p', I2],
    ['kw', 'return '],
    ['var', '$this'],
    ['p', '->'],
    ['fn', 'design'],
    ['p', '('],
    ['var', '$need'],
    ['p', ')'],
  );
  line(
    'solid',
    ['p', `${I3}->`],
    ['fn', 'apply'],
    ['p', '('],
    ['ty', 'Principle'],
    ['p', '::'],
    ['en', 'SOLID'],
    ['p', ')'],
  );
  line('test', ['p', `${I3}->`], ['fn', 'test'], ['p', '()']);
  line('ship', ['p', `${I3}->`], ['fn', 'ship'], ['p', '();']);
  line(null, ['p', `${I1}}`]);
  line('class', ['p', '}']);
  return lines;
}

/**
 * Plain source text of the generated class (copy, tests).
 * @param {CodeLine[]} lines
 */
export const codeText = (lines) =>
  lines.map((l) => l.tokens.map(([, text]) => text).join('')).join('\n');

/**
 * Decorative bearer token shown while the AUTH gate "verifies" the visitor:
 * a real, decodable JWT header and payload ({"sub":"abu-eisha","aud":"/about"}).
 */
export const AUTH_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYnUtZWlzaGEiLCJhdWQiOiIvYWJvdXQifQ';
