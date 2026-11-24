import { mapTestimonial } from './testimonials';
import { isoDate, mapList, mapTechnologies, optional, paragraphs, text, url } from './shared';

/**
 * `GET /projects` and `GET /projects/{slug}` → the app's project shape.
 * Components only ever see `Project`; the API field names stay here
 * (API_CONTRACT.md §3, real responses in docs/api-fixtures/projects.*).
 */

/**
 * @typedef {Object} Project
 * @property {number} id
 * @property {string} slug
 * @property {string} title
 * @property {string} subtitle
 * @property {string} summary        `short_description` (falls back to `subtitle`).
 * @property {string} type           `project_type` enum (filter facet).
 * @property {string} type_label     Localised label of the type.
 * @property {{ id: number, slug: string, name: string } | null} category
 * @property {number | null} year    Year of `completed_at`.
 * @property {string | null} completed_at  YYYY-MM-DD (sitemap `lastmod`).
 * @property {string | null} role
 * @property {string | null} client
 * @property {string | null} duration
 * @property {boolean} is_featured
 * @property {string | null} cover_image
 * @property {string} cover_alt
 * @property {string | null} preview_image  Second screen for the hover reveal (first gallery image).
 * @property {Array<{ image: string, alt: string }>} gallery
 * @property {string[]} problem      `description`, one item per paragraph.
 * @property {string[]} solution
 * @property {string[]} results
 * @property {Array<{ title: string, body: string }>} challenges
 * @property {Array<{ label: string, value: string | null }>} metrics
 * @property {string | null} live_url
 * @property {string | null} github_url   `repo_url`.
 * @property {import('./shared').Technology[]} technologies
 * @property {Project[]} related_projects   Detail only.
 * @property {import('./testimonials').Testimonial[]} testimonials  Detail only.
 */

/**
 * `metrics` is `[]` or `null` today; accept `{label|name|key, value}` items.
 * @param {unknown} metrics
 */
function mapMetrics(metrics) {
  if (!Array.isArray(metrics)) return [];
  return metrics
    .map((metric) => {
      const label = text(metric?.label ?? metric?.name ?? metric?.key);
      if (!label) return null;
      const value =
        metric?.value === null || metric?.value === undefined ? null : text(metric.value);
      return { label, value: value || null };
    })
    .filter((metric) => metric !== null);
}

/**
 * `challenge` is always an array of `{title, description}` (an old plain
 * string arrives as one item with an empty title).
 * @param {unknown} challenge
 */
function mapChallenges(challenge) {
  const items = Array.isArray(challenge)
    ? challenge
    : text(challenge)
      ? [{ description: challenge }]
      : [];
  return items
    .map((item) => ({ title: text(item?.title), body: text(item?.description ?? item?.body) }))
    .filter((item) => item.title || item.body);
}

/**
 * @param {any} raw One API project (list item, detail or related project).
 * @returns {Project | null}
 */
export function mapProject(raw) {
  const slug = text(raw?.slug);
  const title = text(raw?.title);
  if (!slug || !title) return null;
  const completed = isoDate(raw.completed_at);
  const gallery = (Array.isArray(raw.gallery) ? raw.gallery : [])
    .map((item) => url(typeof item === 'string' ? item : item?.url))
    .filter((image) => image !== null);
  const total = gallery.length;

  return {
    id: Number(raw.id),
    slug,
    title,
    subtitle: text(raw.subtitle),
    summary: text(raw.short_description) || text(raw.subtitle),
    type: text(raw.project_type) || 'project',
    type_label: text(raw.project_type_label) || text(raw.project_type),
    category: raw.category?.slug
      ? { id: raw.category.id, slug: text(raw.category.slug), name: text(raw.category.name) }
      : null,
    year: completed ? Number(completed.slice(0, 4)) : null,
    completed_at: completed,
    role: optional(raw.role_title),
    client: optional(raw.client_name),
    duration: optional(raw.duration),
    is_featured: raw.is_featured === true,
    cover_image: url(raw.cover_image),
    cover_alt: title,
    preview_image: gallery[0] ?? null,
    // The API sends bare URLs (no alt text): number them under the title.
    gallery: gallery.map((image, i) => ({ image, alt: `${title} (${i + 1}/${total})` })),
    problem: paragraphs(raw.description),
    solution: paragraphs(raw.solution),
    results: paragraphs(raw.results),
    challenges: mapChallenges(raw.challenge),
    metrics: mapMetrics(raw.metrics),
    live_url: url(raw.live_url),
    github_url: url(raw.repo_url),
    technologies: mapTechnologies(raw.technologies),
    related_projects: mapList(mapProject)(raw.related_projects),
    testimonials: mapList(mapTestimonial)(raw.testimonials),
  };
}

export const mapProjects = mapList(mapProject);
