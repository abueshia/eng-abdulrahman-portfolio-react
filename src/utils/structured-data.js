/**
 * Schema.org JSON-LD builders. Pure functions over API data so the same
 * output is produced by the prerenderer and the browser.
 */
import { env } from '@/config/env';
import { localizePath } from '@/config/routes';

/** Only absolute http(s) URLs are valid `sameAs` / `url` values. */
const isAbsoluteUrl = (/** @type {unknown} */ value) =>
  typeof value === 'string' && /^https?:\/\//.test(value);

/**
 * Person + WebSite graph for the home page.
 * @param {any} general `settings.general` from GET /settings.
 * @param {'ar' | 'en'} locale
 * @returns {object | undefined}
 */
export function buildHomeJsonLd(general, locale) {
  if (!general) return undefined;
  const url = `${env.siteUrl}${localizePath(locale, '/')}`;
  const personId = `${env.siteUrl}/#person`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': personId,
        name: general.owner_name,
        jobTitle: general.job_title,
        url,
        ...(general.avatar ? { image: new URL(general.avatar, `${env.siteUrl}/`).href } : {}),
        sameAs: (general.socials ?? []).map((s) => s.url).filter(isAbsoluteUrl),
        knowsAbout: ['PHP', 'Laravel', 'React', 'REST API', 'Clean Architecture', 'SOLID'],
      },
      {
        '@type': 'WebSite',
        '@id': `${env.siteUrl}/#website`,
        url,
        name: general.site_name,
        inLanguage: locale,
        publisher: { '@id': personId },
      },
    ],
  };
}
