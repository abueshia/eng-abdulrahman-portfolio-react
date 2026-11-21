/**
 * Schema.org JSON-LD builders. Pure functions over API data so the same
 * output is produced by the prerenderer and the browser.
 */
import { env } from '@/config/env';
import { localizePath } from '@/config/routes';

/** Contact channels, not identity profiles: never listed in `sameAs`. */
const NON_PROFILE_PLATFORMS = new Set(['whatsapp', 'email', 'phone']);

/** Only absolute http(s) URLs are valid `sameAs` / `url` values. */
const isAbsoluteUrl = (/** @type {unknown} */ value) =>
  typeof value === 'string' && /^https?:\/\//.test(value);

/** Short English role used in `jobTitle` alongside the localized one. */
const COMPANY_ROLE_EN = 'CEO';

/**
 * ProfilePage + Person + WebSite graph for the home page.
 *
 * The home page is the owner's profile, so it is a `ProfilePage` whose
 * `mainEntity` is the Person. The Person carries both titles (engineer and
 * company role) and `worksFor` the company they run.
 * @param {any} general `settings.general` from GET /settings.
 * @param {'ar' | 'en'} locale
 * @returns {object | undefined}
 */
export function buildHomeJsonLd(general, locale) {
  if (!general) return undefined;
  const url = `${env.siteUrl}${localizePath(locale, '/')}`;
  const personId = `${env.siteUrl}/#person`;
  const company = general.company?.name ? general.company : null;
  const companyRole = company ? `${COMPANY_ROLE_EN}, ${company.name}` : null;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${url}#profile`,
        url,
        name: general.site_name,
        inLanguage: locale,
        mainEntity: { '@id': personId },
        isPartOf: { '@id': `${env.siteUrl}/#website` },
      },
      {
        '@type': 'Person',
        '@id': personId,
        name: general.owner_name,
        jobTitle: companyRole ? [general.job_title, companyRole] : general.job_title,
        ...(company
          ? {
              worksFor: {
                '@type': 'Organization',
                name: company.name,
                ...(isAbsoluteUrl(company.url) ? { url: company.url } : {}),
              },
            }
          : {}),
        url,
        ...(general.avatar ? { image: new URL(general.avatar, `${env.siteUrl}/`).href } : {}),
        sameAs: (general.socials ?? [])
          .filter((s) => !NON_PROFILE_PLATFORMS.has(s.platform))
          .map((s) => s.url)
          .filter(isAbsoluteUrl),
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
