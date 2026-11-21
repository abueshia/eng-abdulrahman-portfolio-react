/**
 * Strings of the phase-5 sections (testimonials, FAQ, contact, footer),
 * split out of the main locale bundles so they ship with the lazy chunks that
 * use them. Same contract as `work.js`: importing registers both languages
 * (deep-merged into the default namespace) before anything renders.
 */
import i18n from '@/i18n';
import ar from './locales/sections.ar.json';
import en from './locales/sections.en.json';

for (const [lng, bundle] of Object.entries({ ar, en })) {
  i18n.addResourceBundle(lng, 'translation', bundle, true, false);
}

export default i18n;
