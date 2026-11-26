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
const COMPANY_ROLE_EN = 'Team Lead';

/** Topics the Person demonstrably works with (mirrors the skills and services sections). */
const KNOWS_ABOUT = [
  'PHP',
  'Laravel',
  'React',
  'JavaScript',
  'REST API',
  'MySQL',
  'PostgreSQL',
  'Redis',
  'Payment gateway integration',
  'Clean Architecture',
  'SOLID',
  'Technical SEO',
];

/**
 * Public postal address: city and country only, never a street address.
 * @param {any} general
 */
function postalAddress(general) {
  const address = general?.address;
  if (!address?.locality && !address?.country_code) return undefined;
  return {
    '@type': 'PostalAddress',
    ...(address.locality ? { addressLocality: address.locality } : {}),
    ...(address.country_code ? { addressCountry: address.country_code } : {}),
  };
}

/**
 * `areaServed` from settings: plain place names.
 * @param {any} general
 */
const areaServed = (general) =>
  (Array.isArray(general?.area_served) ? general.area_served : [])
    .filter((name) => typeof name === 'string' && name)
    .map((name) => ({ '@type': 'Place', name }));

/**
 * ProfilePage + Person + WebSite graph for the home page.
 *
 * The home page is the owner's profile, so it is a `ProfilePage` whose
 * `mainEntity` is the Person. The Person carries both titles (engineer and
 * company role) and `worksFor` the company they run.
 * When the services catalogue is passed, a `ProfessionalService` founded by
 * the Person carries it as an `OfferCatalog` (one sub-catalogue per group),
 * mirroring the services section that is visible on the page.
 * @param {any} general `settings.general` from GET /settings.
 * @param {'ar' | 'en'} locale
 * When the FAQ is passed (and visible), a `FAQPage` lists every question
 * with its accepted answer, exactly as the FAQ section shows them.
 * @param {{ services?: any[], catalogName?: string, faqs?: any[], description?: string }} [extra]
 * @returns {object | undefined}
 */
export function buildHomeJsonLd(
  general,
  locale,
  { services = [], catalogName, faqs = [], description } = {},
) {
  if (!general) return undefined;
  const url = `${env.siteUrl}${localizePath(locale, '/')}`;
  const personId = `${env.siteUrl}/#person`;
  const company = general.company?.name ? general.company : null;
  const companyRole = company ? `${COMPANY_ROLE_EN}, ${company.name}` : null;
  const address = postalAddress(general);
  const served = areaServed(general);
  const alternateNames = (general.alternate_names ?? []).filter(
    (/** @type {unknown} */ name) =>
      typeof name === 'string' && name && name !== general.owner_name,
  );

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
        ...(alternateNames.length > 0 ? { alternateName: alternateNames } : {}),
        ...(description ? { description } : {}),
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
        knowsAbout: KNOWS_ABOUT,
        knowsLanguage: ['ar', 'en'],
        ...(address ? { address } : {}),
        ...(served.length > 0 ? { areaServed: served } : {}),
      },
      {
        '@type': 'WebSite',
        '@id': `${env.siteUrl}/#website`,
        url,
        name: general.site_name,
        ...(description ? { description } : {}),
        inLanguage: locale,
        publisher: { '@id': personId },
      },
      ...(services.length > 0
        ? [buildServicesNode({ general, url, personId, services, catalogName })]
        : []),
      ...(faqs.length > 0
        ? [
            {
              '@type': 'FAQPage',
              '@id': `${url}#faq`,
              url: `${url}#faq`,
              inLanguage: locale,
              isPartOf: { '@id': `${env.siteUrl}/#website` },
              mainEntity: faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: { '@type': 'Answer', text: faq.answer },
              })),
            },
          ]
        : []),
    ],
  };
}

/**
 * ProfessionalService node with the offer catalogue, grouped like the page.
 * @param {{ general: any, url: string, personId: string, services: any[], catalogName?: string }} input
 */
function buildServicesNode({ general, url, personId, services, catalogName }) {
  /** @type {Map<string, { name: string, items: any[] }>} */
  const groups = new Map();
  for (const service of services) {
    const key = service.group?.slug ?? 'other';
    if (!groups.has(key)) groups.set(key, { name: service.group?.name ?? key, items: [] });
    groups.get(key)?.items.push({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: service.title,
        description: service.description,
        ...(service.group?.name ? { serviceType: service.group.name } : {}),
        provider: { '@id': personId },
      },
    });
  }
  return {
    '@type': 'ProfessionalService',
    '@id': `${env.siteUrl}/#services`,
    name: general.site_name,
    url: `${url}#services`,
    ...(general.avatar ? { image: new URL(general.avatar, `${env.siteUrl}/`).href } : {}),
    ...(postalAddress(general) ? { address: postalAddress(general) } : {}),
    ...(areaServed(general).length > 0 ? { areaServed: areaServed(general) } : {}),
    founder: { '@id': personId },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: catalogName ?? general.site_name,
      itemListElement: [...groups.values()].map((group) => ({
        '@type': 'OfferCatalog',
        name: group.name,
        itemListElement: group.items,
      })),
    },
  };
}

/** Absolute URL of the `/projects` index in a locale. */
const projectsUrl = (/** @type {'ar' | 'en'} */ locale) =>
  `${env.siteUrl}${localizePath(locale, '/projects')}`;

/**
 * `/projects` structured data: a `CollectionPage` (part of the site, about
 * the Person's work) and its `BreadcrumbList`.
 * @param {'ar' | 'en'} locale
 * @param {{ home: string, work: string }} labels Breadcrumb names (localised).
 */
export function buildProjectsJsonLd(locale, labels) {
  const home = `${env.siteUrl}${localizePath(locale, '/')}`;
  const url = projectsUrl(locale);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${url}#page`,
        url,
        name: labels.work,
        inLanguage: locale,
        isPartOf: { '@id': `${env.siteUrl}/#website` },
        about: { '@id': `${env.siteUrl}/#person` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: labels.home, item: home },
          { '@type': 'ListItem', position: 2, name: labels.work, item: url },
        ],
      },
    ],
  };
}

/**
 * Case-study structured data: `CreativeWork` (or `SoftwareSourceCode` when
 * the code is public) authored by the Person, plus a `BreadcrumbList`.
 * Every project comes from the API (published, real work).
 * @param {import('@/services/api/mappers/projects').Project | null | undefined} project
 *   Mapped project from GET /projects/{slug}.
 * @param {'ar' | 'en'} locale
 * @param {{ home: string, work: string }} labels Breadcrumb names (localised).
 * @returns {object | undefined}
 */
export function buildProjectJsonLd(project, locale, labels) {
  if (!project) return undefined;
  const home = `${env.siteUrl}${localizePath(locale, '/')}`;
  const url = `${env.siteUrl}${localizePath(locale, `/projects/${project.slug}`)}`;
  const code = isAbsoluteUrl(project.github_url);
  const image = project.cover_image ? new URL(project.cover_image, `${env.siteUrl}/`).href : null;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': code ? 'SoftwareSourceCode' : 'CreativeWork',
        '@id': `${url}#work`,
        name: project.title,
        description: project.summary,
        url,
        inLanguage: locale,
        ...(image ? { image } : {}),
        // The API exposes no publish/update dates: completion is the one real date.
        ...(project.completed_at ? { dateCreated: project.completed_at } : {}),
        ...(project.category?.name ? { genre: project.category.name } : {}),
        author: { '@id': `${env.siteUrl}/#person` },
        keywords: (project.technologies ?? []).map((tech) => tech.name),
        ...(code ? { codeRepository: project.github_url } : {}),
        ...(isAbsoluteUrl(project.live_url) ? { sameAs: [project.live_url] } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: labels.home, item: home },
          { '@type': 'ListItem', position: 2, name: labels.work, item: projectsUrl(locale) },
          { '@type': 'ListItem', position: 3, name: project.title, item: url },
        ],
      },
    ],
  };
}
