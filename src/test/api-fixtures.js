/**
 * The live resources (projects, experiences, testimonials, FAQs) have no mock
 * data in the app: the test suite serves them from the REAL responses
 * captured from the Laravel API (docs/api-fixtures, API_CONTRACT.md), through
 * the mock adapter, so every test exercises the real envelope and the real
 * mappers. Registered once in `src/test/setup.js`.
 */
import experiencesAr from '../../docs/api-fixtures/experiences.index.ar.json';
import experiencesEn from '../../docs/api-fixtures/experiences.index.en.json';
import faqsAr from '../../docs/api-fixtures/faqs.index.ar.json';
import faqsEn from '../../docs/api-fixtures/faqs.index.en.json';
import projectsAr from '../../docs/api-fixtures/projects.index.ar.json';
import projectsAr2 from '../../docs/api-fixtures/projects.index.page2.ar.json';
import projectsEn from '../../docs/api-fixtures/projects.index.per_page50.en.json';
import notFound from '../../docs/api-fixtures/projects.show.404-missing.json';
import showAr from '../../docs/api-fixtures/projects.show.ar.json';
import showEn from '../../docs/api-fixtures/projects.show.en.json';
import smallAr from '../../docs/api-fixtures/projects.show.small-gallery.ar.json';
import smallEn from '../../docs/api-fixtures/projects.show.small-gallery.en.json';
import testimonialsAr from '../../docs/api-fixtures/testimonials.index.ar.json';
import testimonialsEn from '../../docs/api-fixtures/testimonials.index.en.json';

/** Every published project, per language (the Arabic capture spans two pages). */
const PROJECTS = {
  ar: [...projectsAr.data, ...projectsAr2.data],
  en: projectsEn.data,
};

/** Captured detail responses, by language and slug. */
const DETAILS = {
  ar: new Map([showAr.data, smallAr.data].map((project) => [project.slug, project])),
  en: new Map([showEn.data, smallEn.data].map((project) => [project.slug, project])),
};

/** A slug with a captured detail response (17 gallery images). */
export const FIXTURE_SLUG = showEn.data.slug;
/** A slug with a captured detail response that links a testimonial. */
export const FIXTURE_SLUG_WITH_REVIEW = smallEn.data.slug;

/**
 * The captured envelope as-is, by language.
 * @param {{ ar: any, en: any }} byLang
 */
const capture =
  (byLang) =>
  (/** @type {{ lang: 'ar' | 'en' }} */ { lang }) => ({
    status: 200,
    body: byLang[lang],
  });

/** Laravel's paginator over the captured list (API pagination keys). */
function projectsPage(
  /** @type {{ lang: 'ar' | 'en', query: Record<string, any> }} */ { lang, query },
) {
  // `featured=1` filters like the API does (today it returns `[]`).
  const featured = ['1', 'true'].includes(String(query.featured));
  const all = featured
    ? PROJECTS[lang].filter((project) => project.is_featured === true)
    : PROJECTS[lang];
  const perPage = Math.min(Math.max(Number(query.per_page) || 9, 1), 50);
  const lastPage = Math.max(Math.ceil(all.length / perPage), 1);
  const page = Math.min(Math.max(Number(query.page) || 1, 1), lastPage);
  return {
    status: 200,
    body: {
      code: 200,
      success: true,
      message: 'Projects retrieved successfully',
      pagination: {
        current_page: page,
        prev_page_url: '',
        next_page_url: '',
        total_pages: lastPage,
        per_page: perPage,
        total_items: all.length,
      },
      data: all.slice((page - 1) * perPage, page * perPage),
    },
  };
}

/**
 * A captured detail when there is one; otherwise the list item with the
 * detail-only keys (still the real record), or the real 404.
 */
function projectDetail(
  /** @type {{ lang: 'ar' | 'en', params: Record<string, string> }} */ { lang, params },
) {
  const captured = DETAILS[lang].get(params.slug);
  const item = captured ?? PROJECTS[lang].find((project) => project.slug === params.slug);
  if (!item) return { status: 404, body: notFound };
  return {
    status: 200,
    body: {
      code: 200,
      success: true,
      message: 'Project retrieved successfully',
      data: captured ?? { ...item, testimonials: [], related_projects: [] },
    },
  };
}

export const fixtureRoutes = [
  { method: 'get', pattern: '/projects', handler: projectsPage },
  { method: 'get', pattern: '/projects/:slug', handler: projectDetail },
  {
    method: 'get',
    pattern: '/experiences',
    handler: capture({ ar: experiencesAr, en: experiencesEn }),
  },
  {
    method: 'get',
    pattern: '/testimonials',
    handler: capture({ ar: testimonialsAr, en: testimonialsEn }),
  },
  { method: 'get', pattern: '/faqs', handler: capture({ ar: faqsAr, en: faqsEn }) },
];
