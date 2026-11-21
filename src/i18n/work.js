/**
 * Strings of the "work" features (case files, case study, services), split
 * out of the main locale bundles so they ship with the lazy chunks that use
 * them instead of the initial bundle.
 *
 * Importing this module registers them (both languages, merged into the
 * default namespace). Module evaluation precedes rendering, so the
 * prerenderer and the hydrating client always render with them loaded.
 * Idempotent: every consumer imports it.
 */
import i18n from '@/i18n';
import ar from './locales/work.ar.json';
import en from './locales/work.en.json';

for (const [lng, bundle] of Object.entries({ ar, en })) {
  i18n.addResourceBundle(lng, 'translation', bundle, true, false);
}

export default i18n;
