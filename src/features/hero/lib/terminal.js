/**
 * The hero terminal's command interpreter. Pure: it maps input to output
 * lines plus an optional side effect, and the component performs the effect.
 * All copy comes from i18n (`terminal.*`); all facts come from settings and
 * the projects API, so the terminal never says anything the site doesn't.
 *
 * @typedef {'plain' | 'muted' | 'ok' | 'ember' | 'ion' | 'error'} Tone
 * @typedef {{ text: string, tone?: Tone }} TermLine
 * @typedef {{ type: 'clear' }
 *   | { type: 'scroll', target: string }
 *   | { type: 'download', href: string }
 *   | { type: 'theme' }
 *   | { type: 'locale' }
 *   | { type: 'outage' }} TermEffect
 * @typedef {{ lines: TermLine[], effect?: TermEffect }} TermResult
 * @typedef {Object} TermContext
 * @property {(key: string, options?: Record<string, unknown>) => string} t
 * @property {any} [general]  settings.general
 * @property {any} [hero]     settings.hero
 * @property {Array<{ title: string }>} [projects]
 */

/** Documented commands, in `help` order. */
export const COMMANDS = Object.freeze([
  'help',
  'whoami',
  'stack',
  'projects',
  'contact',
  'hire --me',
  'cv',
  'theme',
  'lang',
  'clear',
]);

/** Undocumented. `help` only hints that it exists. */
export const SECRET_COMMAND = 'php artisan down';

/** @param {string} raw */
export const normalizeCommand = (raw) => raw.trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * Tab completion against the documented commands.
 * @param {string} partial
 * @returns {string | null}
 */
export function completeCommand(partial) {
  const value = normalizeCommand(partial);
  if (!value) return null;
  return COMMANDS.find((command) => command.startsWith(value) && command !== value) ?? null;
}

/**
 * @param {Array<{ key: string, value: string }>} stack
 * @returns {TermLine[]}
 */
export const stackTree = (stack) =>
  stack.map((row, i) => ({
    text: `${i === stack.length - 1 ? '└─' : '├─'} ${row.key.padEnd(9)} ${row.value}`,
    tone: /** @type {Tone} */ ('muted'),
  }));

/**
 * @param {string} raw
 * @param {TermContext} ctx
 * @returns {TermResult}
 */
export function runCommand(raw, ctx) {
  const input = normalizeCommand(raw);
  const { t, general = {}, hero = {}, projects = [] } = ctx;
  if (!input) return { lines: [] };

  if (input === SECRET_COMMAND || input === 'artisan down') {
    return { lines: [{ text: t('terminal.down'), tone: 'error' }], effect: { type: 'outage' } };
  }
  if (input === 'php artisan up' || input === 'artisan up') {
    return { lines: [{ text: t('terminal.alreadyUp'), tone: 'ok' }] };
  }
  if (input.startsWith('php artisan') || input === 'artisan') {
    return { lines: [{ text: t('terminal.artisan'), tone: 'ember' }] };
  }
  if (input.startsWith('sudo')) {
    return { lines: [{ text: t('terminal.sudo'), tone: 'error' }] };
  }

  switch (input) {
    case 'help':
      return {
        lines: [
          { text: t('terminal.help.title') },
          ...COMMANDS.map((command) => ({
            text: `  ${command.padEnd(10)} ${t(`terminal.help.${command.split(' ')[0]}`)}`,
            tone: /** @type {Tone} */ ('muted'),
          })),
          { text: t('terminal.help.secret'), tone: 'ember' },
        ],
      };
    case 'whoami':
      return {
        lines: [
          { text: [general.owner_name, general.job_title].filter(Boolean).join(' · '), tone: 'ok' },
          { text: general.location ?? '', tone: 'muted' },
          {
            text: t('terminal.experience', { count: general.years_of_experience ?? 0 }),
            tone: 'muted',
          },
        ],
      };
    case 'stack':
    case 'ls':
      return { lines: stackTree(hero.terminal_stack ?? []) };
    case 'projects':
      return {
        lines: [
          ...projects.slice(0, 5).map((project, i, list) => ({
            text: `${i === list.length - 1 ? '└─' : '├─'} ${project.title}`,
            tone: /** @type {Tone} */ ('muted'),
          })),
          { text: t('terminal.projects'), tone: 'ion' },
        ],
        effect: { type: 'scroll', target: 'projects' },
      };
    case 'contact':
      return {
        lines: [
          general.email && { text: `mail   ${general.email}`, tone: /** @type {Tone} */ ('ok') },
          general.phone && { text: `phone  ${general.phone}`, tone: /** @type {Tone} */ ('muted') },
          ...(general.socials ?? []).map((/** @type {any} */ social) => ({
            text: `${social.platform.padEnd(6)} ${social.url.replace(/^https?:\/\/(www\.)?/, '')}`,
            tone: /** @type {Tone} */ ('muted'),
          })),
        ].filter(Boolean),
      };
    case 'hire':
    case 'hire --me':
    case 'hire me':
      return {
        lines: [
          { text: 'HTTP/1.1 201 Created', tone: 'ok' },
          { text: t('terminal.hire'), tone: 'muted' },
          { text: 'Location: /#contact', tone: 'ion' },
        ],
        effect: { type: 'scroll', target: 'contact' },
      };
    case 'cv':
      return {
        lines: [{ text: t('terminal.cv'), tone: 'ok' }],
        ...(general.cv_url ? { effect: { type: 'download', href: general.cv_url } } : {}),
      };
    case 'theme':
      return { lines: [{ text: t('terminal.theme'), tone: 'ok' }], effect: { type: 'theme' } };
    case 'lang':
      return { lines: [{ text: t('terminal.lang'), tone: 'ok' }], effect: { type: 'locale' } };
    case 'clear':
      return { lines: [], effect: { type: 'clear' } };
    case 'exit':
      return { lines: [{ text: t('terminal.exit'), tone: 'ember' }] };
    default:
      return {
        lines: [{ text: t('terminal.notFound', { command: input.split(' ')[0] }), tone: 'error' }],
      };
  }
}
