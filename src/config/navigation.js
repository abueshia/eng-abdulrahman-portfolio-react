import { SECTION_IDS, paths } from './routes';

/**
 * Primary navigation model. Labels are i18n keys; `to` is locale-agnostic
 * and gets prefixed by `LocalizedLink`.
 * @type {ReadonlyArray<{ key: string, to: string, section?: string }>}
 */
export const NAV_ITEMS = Object.freeze([
  { key: 'nav.about', to: paths.section(SECTION_IDS.about), section: 'about' },
  { key: 'nav.skills', to: paths.section(SECTION_IDS.skills), section: 'skills' },
  { key: 'nav.experience', to: paths.section(SECTION_IDS.experience), section: 'experience' },
  { key: 'nav.projects', to: paths.section(SECTION_IDS.projects), section: 'projects' },
  { key: 'nav.services', to: paths.section(SECTION_IDS.services), section: 'services' },
  { key: 'nav.blog', to: paths.blog() },
  { key: 'nav.contact', to: paths.section(SECTION_IDS.contact), section: 'contact' },
]);
