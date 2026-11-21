/**
 * Mock route table: one handler per Laravel endpoint.
 *
 * Handlers receive `{ lang, query, body, params }` and return `{ status, body }`
 * built with `ok()` / `fail()`, so payloads match the real API envelope.
 */
import {
  blogCategories,
  blogs,
  credentials,
  experiences,
  faqs,
  projects,
  serviceGroups,
  services,
  settings,
  stats,
  technologies,
  technologyCategories,
  testimonials,
} from '@/data/mock';
import { fail, localize, ok, paginate } from './response';

/**
 * @typedef {Object} MockContext
 * @property {'ar' | 'en'} lang
 * @property {Record<string, any>} query
 * @property {Record<string, any>} body
 * @property {Record<string, string>} params  Named route parameters.
 */

const techBySlug = new Map(technologies.map((tech) => [tech.slug, tech]));
const categoryBySlug = new Map(blogCategories.map((c) => [c.slug, c]));

/** Expands technology slugs into lightweight objects, like an eager-loaded relation. */
const expandTechs = (slugs) =>
  slugs
    .map((slug) => techBySlug.get(slug))
    .filter(Boolean)
    .map(({ slug, name, icon }) => ({ slug, name, icon }));

/** Project list item (ProjectResource in "summary" mode). */
const projectSummary = (p) => ({
  id: p.id,
  slug: p.slug,
  is_sample: p.is_sample,
  title: p.title,
  summary: p.summary,
  type: p.type,
  year: p.year,
  role: p.role,
  is_featured: p.is_featured,
  cover_image: p.cover_image,
  cover_alt: p.cover_alt,
  preview_image: p.preview_image,
  metrics: p.metrics,
  technologies: expandTechs(p.technologies),
  published_at: p.published_at,
  updated_at: p.updated_at,
});

const groupBySlug = new Map(serviceGroups.map((group) => [group.slug, group]));

/** Services in display order, each with its eager-loaded group (ServiceResource). */
const servicesWithGroups = () =>
  services
    .map((service) => ({ ...service, group: groupBySlug.get(service.group) ?? null }))
    .sort((a, b) => (a.group?.sort ?? 99) - (b.group?.sort ?? 99) || a.id - b.id);

const blogSummary = (b) => ({
  id: b.id,
  slug: b.slug,
  title: b.title,
  excerpt: b.excerpt,
  cover_image: b.cover_image,
  category: categoryBySlug.get(b.category) ?? null,
  tags: b.tags,
  reading_time: b.reading_time,
  published_at: b.published_at,
});

/** Related projects: shared type first, then most shared technologies. */
function relatedProjects(project, limit = 3) {
  return projects
    .filter((p) => p.slug !== project.slug)
    .map((p) => ({
      p,
      score:
        (p.type === project.type ? 10 : 0) +
        p.technologies.filter((tech) => project.technologies.includes(tech)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ p }) => projectSummary(p));
}

const groupedTechnologies = () =>
  [...technologyCategories]
    .sort((a, b) => a.sort - b.sort)
    .map((category) => ({
      category: category.slug,
      name: category.name,
      technologies: technologies
        .filter((tech) => tech.category === category.slug)
        .map(({ category: _omit, ...tech }) => tech),
    }));

/** Server-side rules mirrored from the Laravel ContactRequest. */
function validateContact(body) {
  /** @type {Record<string, string[]>} */
  const errors = {};
  const required = ['name', 'email', 'message'];
  required.forEach((field) => {
    if (!String(body[field] ?? '').trim()) errors[field] = [`The ${field} field is required.`];
  });
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.email = ['The email field must be a valid email address.'];
  }
  if (body.message && String(body.message).trim().length < 10) {
    errors.message = ['The message field must be at least 10 characters.'];
  }
  return errors;
}

/** @type {Array<{ method: string, pattern: string, handler: (ctx: MockContext) => { status: number, body: any } }>} */
export const routes = [
  { method: 'get', pattern: '/settings', handler: ({ lang }) => ok(localize(settings, lang)) },
  {
    method: 'get',
    pattern: '/home',
    handler: ({ lang }) =>
      ok(
        localize(
          {
            stats,
            featured_projects: projects.filter((p) => p.is_featured).map(projectSummary),
            services: servicesWithGroups(),
            testimonials,
            latest_blogs: blogs.slice(0, 3).map(blogSummary),
          },
          lang,
        ),
      ),
  },
  {
    method: 'get',
    pattern: '/projects',
    handler: ({ lang, query }) => {
      let list = projects;
      if (query.type) list = list.filter((p) => p.type === query.type);
      if (query.technology) list = list.filter((p) => p.technologies.includes(query.technology));
      if (query.featured !== undefined) {
        const featured = ['1', 'true', true, 1].includes(query.featured);
        list = list.filter((p) => p.is_featured === featured);
      }
      const { items, pagination } = paginate(list, query, 12);
      return ok(localize(items.map(projectSummary), lang), { pagination });
    },
  },
  {
    method: 'get',
    pattern: '/projects/:slug',
    handler: ({ lang, params }) => {
      const project = projects.find((p) => p.slug === params.slug);
      if (!project) return fail(404, 'Project not found.');
      return ok(
        localize(
          {
            ...project,
            technologies: expandTechs(project.technologies),
            related_projects: relatedProjects(project),
          },
          lang,
        ),
      );
    },
  },
  {
    method: 'get',
    pattern: '/technologies',
    handler: ({ lang }) => ok(localize(groupedTechnologies(), lang)),
  },
  {
    method: 'get',
    pattern: '/experiences',
    handler: ({ lang }) =>
      ok(
        localize(
          experiences.map((e) => ({ ...e, technologies: expandTechs(e.technologies) })),
          lang,
        ),
      ),
  },
  {
    method: 'get',
    pattern: '/credentials',
    handler: ({ lang }) => ok(localize(credentials, lang)),
  },
  {
    method: 'get',
    pattern: '/services',
    handler: ({ lang }) => ok(localize(servicesWithGroups(), lang)),
  },
  {
    method: 'get',
    pattern: '/testimonials',
    handler: ({ lang }) => ok(localize(testimonials, lang)),
  },
  // Static segment must be registered before the `:slug` route.
  {
    method: 'get',
    pattern: '/blogs/categories',
    handler: ({ lang }) => ok(localize(blogCategories, lang)),
  },
  {
    method: 'get',
    pattern: '/blogs',
    handler: ({ lang, query }) => {
      const list = query.category ? blogs.filter((b) => b.category === query.category) : blogs;
      const { items, pagination } = paginate(list, query, 9);
      return ok(localize(items.map(blogSummary), lang), { pagination });
    },
  },
  {
    method: 'get',
    pattern: '/blogs/:slug',
    handler: ({ lang, params }) => {
      const post = blogs.find((b) => b.slug === params.slug);
      if (!post) return fail(404, 'Post not found.');
      return ok(localize({ ...blogSummary(post), content: post.content }, lang));
    },
  },
  { method: 'get', pattern: '/faqs', handler: ({ lang }) => ok(localize(faqs, lang)) },
  { method: 'get', pattern: '/stats', handler: ({ lang }) => ok(localize(stats, lang)) },
  {
    method: 'post',
    pattern: '/contact',
    handler: ({ body, lang }) => {
      // Honeypot: bots fill hidden fields. Pretend success, store nothing.
      if (body.website) return ok(null, { code: 201, message: 'Message sent.' });
      const errors = validateContact(body);
      if (Object.keys(errors).length) return fail(422, 'The given data was invalid.', errors);
      return ok(
        { id: Date.now() },
        {
          code: 201,
          message: lang === 'ar' ? 'تم إرسال رسالتك بنجاح.' : 'Your message has been sent.',
        },
      );
    },
  },
];

/**
 * Finds the handler for a method + path, extracting `:named` params.
 * @param {string} method
 * @param {string} path
 * @returns {{ handler: (ctx: MockContext) => any, params: Record<string, string> } | null}
 */
export function matchRoute(method, path) {
  const target = path.replace(/\/+$/, '') || '/';
  const segments = target.split('/');
  for (const route of routes) {
    if (route.method !== method) continue;
    const parts = route.pattern.split('/');
    if (parts.length !== segments.length) continue;
    /** @type {Record<string, string>} */
    const params = {};
    const matched = parts.every((part, i) => {
      if (part.startsWith(':')) {
        params[part.slice(1)] = decodeURIComponent(segments[i]);
        return true;
      }
      return part === segments[i];
    });
    if (matched) return { handler: route.handler, params };
  }
  return null;
}
