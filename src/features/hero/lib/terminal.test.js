import { describe, expect, it } from 'vitest';

import { COMMANDS, SECRET_COMMAND, completeCommand, runCommand } from './terminal';

/** Echo translator: returns the key (plus options) so assertions stay copy-independent. */
const t = (/** @type {string} */ key, /** @type {any} */ options) =>
  options ? `${key}:${JSON.stringify(options)}` : key;

const ctx = {
  t,
  general: {
    owner_name: 'Abdulrahman Abu Eisha',
    job_title: 'Full-Stack Software Engineer',
    location: 'Cairo',
    years_of_experience: 4,
    email: 'mail@example.test',
    cv_url: '/cv/file.pdf',
    socials: [{ platform: 'github', url: 'https://github.com/example' }],
  },
  hero: { terminal_stack: [{ key: 'backend', value: 'PHP · Laravel' }] },
  projects: [{ title: 'One' }, { title: 'Two' }],
};

describe('hero terminal interpreter', () => {
  it('lists every documented command in help, and only hints at the secret one', () => {
    const { lines } = runCommand('help', ctx);
    const text = lines.map((line) => line.text).join('\n');
    for (const command of COMMANDS) expect(text).toContain(command);
    expect(text).not.toContain(SECRET_COMMAND);
    expect(text).toContain('terminal.help.secret');
  });

  it('answers from real data (settings), not invented copy', () => {
    const whoami = runCommand('whoami', ctx).lines.map((line) => line.text);
    expect(whoami[0]).toBe('Abdulrahman Abu Eisha · Full-Stack Software Engineer');
    expect(whoami[2]).toContain('"count":4');

    const contact = runCommand('contact', ctx)
      .lines.map((line) => line.text)
      .join('\n');
    expect(contact).toContain('mail@example.test');
    expect(contact).toContain('github.com/example');
  });

  it('maps commands to side effects', () => {
    expect(runCommand('projects', ctx).effect).toEqual({ type: 'scroll', target: 'projects' });
    expect(runCommand('  HIRE   --me ', ctx).effect).toEqual({ type: 'scroll', target: 'contact' });
    expect(runCommand('cv', ctx).effect).toEqual({ type: 'download', href: '/cv/file.pdf' });
    expect(runCommand('theme', ctx).effect).toEqual({ type: 'theme' });
    expect(runCommand('lang', ctx).effect).toEqual({ type: 'locale' });
    expect(runCommand('clear', ctx).effect).toEqual({ type: 'clear' });
  });

  it('triggers the outage on the secret artisan command', () => {
    const result = runCommand('php artisan down', ctx);
    expect(result.effect).toEqual({ type: 'outage' });
    expect(result.lines[0].tone).toBe('error');
  });

  it('rejects sudo and unknown commands without side effects', () => {
    expect(runCommand('sudo rm -rf /', ctx).effect).toBeUndefined();
    const unknown = runCommand('ls -la /etc', ctx);
    expect(unknown.effect).toBeUndefined();
    expect(unknown.lines[0].text).toContain('"command":"ls"');
  });

  it('tab-completes documented commands only', () => {
    expect(completeCommand('hi')).toBe('hire --me');
    expect(completeCommand('wh')).toBe('whoami');
    expect(completeCommand('php')).toBeNull();
    expect(completeCommand('')).toBeNull();
  });
});
