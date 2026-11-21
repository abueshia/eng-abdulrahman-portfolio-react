import { describe, expect, it } from 'vitest';

import {
  LINE_KEYS,
  PRINCIPLE_LINES,
  STORY_LINES,
  buildProfileCode,
  codeText,
} from './profile-code';

const profile = {
  stack: [
    { key: 'backend', value: 'PHP 8.3 · Laravel 12 · REST' },
    { key: 'data', value: "MySQL · O'Reilly" },
  ],
  years: 4,
  company: { name: 'iCode Tech', role: 'CEO' },
  timezone: 'Africa/Cairo',
};

describe('profile code card', () => {
  it('generates a real PHP 8.3 class from the profile data', () => {
    const source = codeText(buildProfileCode(profile));

    expect(source).toContain('final class AbdulrahmanAbuEisha implements Engineer');
    expect(source).toContain('enum Stack: string');
    expect(source).toContain("case Backend = 'PHP 8.3 · Laravel 12 · REST';");
    // Quotes are escaped as PHP requires.
    expect(source).toContain("case Data    = 'MySQL · O\\'Reilly';");
    expect(source).toContain('public readonly int $yearsShipping = 4,');
    expect(source).toContain("public readonly string $company = 'iCode Tech', // CEO");
    expect(source).toContain('->test()');
  });

  it('links every prose block to a line that exists', () => {
    const keys = new Set(buildProfileCode(profile).map((line) => line.key));
    for (const key of [...STORY_LINES, ...Object.values(PRINCIPLE_LINES)]) {
      expect(LINE_KEYS).toContain(key);
      expect(keys.has(key)).toBe(true);
    }
  });

  it('omits what the data does not provide instead of inventing it', () => {
    const source = codeText(buildProfileCode({}));
    expect(source).not.toContain('enum Stack');
    expect(source).not.toContain('$company');
    expect(source).toContain('final class AbdulrahmanAbuEisha');
  });
});
