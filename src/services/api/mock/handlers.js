/**
 * Mock route table for the resources NOT served by the live API
 * (VITE_API_RESOURCES). Projects, experiences, testimonials and FAQs have no
 * mock data: their GET routes are absent here (tests register the real
 * captured responses through `registerMockRoutes`). The two POST routes stay,
 * following the real contract, for builds where those forms are not live.
 *
 * Handlers receive `{ lang, query, body, params }` and return `{ status, body }`
 * built with `ok()` / `fail()`, so payloads match the real API envelope.
 */
import {
  credentials,
  serviceGroups,
  services,
  settings,
  stats,
  technologies,
  technologyCategories,
} from '@/data/mock';
import { fail, localize, ok } from './response';

/**
 * @typedef {Object} MockContext
 * @property {'ar' | 'en'} lang
 * @property {Record<string, any>} query
 * @property {Record<string, any>} body
 * @property {Record<string, string>} params  Named route parameters.
 */

const groupBySlug = new Map(serviceGroups.map((group) => [group.slug, group]));

/** Services in display order, each with its eager-loaded group (ServiceResource). */
const servicesWithGroups = () =>
  services
    .map((service) => ({ ...service, group: groupBySlug.get(service.group) ?? null }))
    .sort((a, b) => (a.group?.sort ?? 99) - (b.group?.sort ?? 99) || a.id - b.id);

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

const CONTACT_TYPES = ['general_contact', 'project_inquiry', 'job_offer', 'consultation'];

/**
 * Rules mirrored from the Laravel contact request (API_CONTRACT.md §7).
 * @param {Record<string, any>} body
 */
function validateContact(body) {
  /** @type {Record<string, string[]>} */
  const errors = {};
  /** @type {Array<[string, number, boolean]>} field, max, required */
  const rules = [
    ['name', 150, true],
    ['email', 150, true],
    ['message', 5000, true],
    ['phone', 50, false],
    ['subject', 255, false],
    ['service', 150, false],
  ];
  for (const [field, max, required] of rules) {
    const value = String(body[field] ?? '').trim();
    if (!value && required) errors[field] = [`The ${field} field is required.`];
    else if (value.length > max) {
      errors[field] = [`The ${field} field must not be greater than ${max} characters.`];
    }
  }
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.email = ['The email field must be a valid email address.'];
  }
  if (body.type && !CONTACT_TYPES.includes(body.type)) {
    errors.type = ['The selected type is invalid.'];
  }
  return errors;
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/**
 * A translatable multipart field: `name`, or `name[ar]` / `name[en]`. The
 * error key follows Laravel's dot notation (`name.ar`).
 * @param {Record<string, any>} body
 * @param {string} field
 * @returns {{ key: string, value: string }}
 */
function translatable(body, field) {
  for (const key of [field, `${field}[ar]`, `${field}[en]`]) {
    const value = String(body[key] ?? '').trim();
    if (value) return { key: key.replace(/\[(ar|en)\]$/, '.$1'), value };
  }
  return { key: field, value: '' };
}

/**
 * Rules mirrored from the Laravel testimonial request (API_CONTRACT.md §5).
 * @param {Record<string, any>} body Multipart fields; `image` is a Blob/File.
 */
function validateTestimonial(body) {
  /** @type {Record<string, string[]>} */
  const errors = {};
  if ('hp' in body) errors.hp = ['The hp field is prohibited.'];
  /** @type {Array<[string, number, number, boolean]>} field, min, max, required */
  const rules = [
    ['name', 2, 80, true],
    ['description', 10, 1000, true],
    ['name_job', 0, 100, false],
    ['company_name', 0, 100, false],
  ];
  for (const [field, min, max, required] of rules) {
    const { key, value } = translatable(body, field);
    if (!value) {
      if (required) errors[field] = [`The ${field} field is required.`];
    } else if (value.length < min) {
      errors[key] = [`The ${field} field must be at least ${min} characters.`];
    } else if (value.length > max) {
      errors[key] = [`The ${field} field must not be greater than ${max} characters.`];
    }
  }
  if (body.rating !== undefined) {
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      errors.rating = ['The rating field must be between 1 and 5.'];
    }
  }
  if (body.consent !== undefined && !['1', 'true', 'on', 'yes'].includes(String(body.consent))) {
    errors.consent = ['The consent field must be accepted.'];
  }
  const image = body.image ?? body.avatar;
  if (image !== undefined && image !== null && image !== '') {
    if (typeof image !== 'object' || !IMAGE_TYPES.includes(image.type)) {
      errors.image = ['The image field must be a file of type: jpg, jpeg, png, webp.'];
    } else if (image.size >= IMAGE_MAX_BYTES) {
      errors.image = ['The image field must not be greater than 5120 kilobytes.'];
    }
  }
  return errors;
}

/** @type {Array<{ method: string, pattern: string, handler: (ctx: MockContext) => { status: number, body: any } }>} */
export const routes = [
  { method: 'get', pattern: '/settings', handler: ({ lang }) => ok(localize(settings, lang)) },
  {
    method: 'get',
    pattern: '/home',
    handler: ({ lang }) => ok(localize({ stats, services: servicesWithGroups() }, lang)),
  },
  {
    method: 'get',
    pattern: '/technologies',
    handler: ({ lang }) => ok(localize(groupedTechnologies(), lang)),
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
    method: 'post',
    pattern: '/testimonials',
    // Same contract as Laravel: validate, store inactive, answer 201.
    // Nothing is stored, like a moderation queue that never approves.
    handler: ({ body }) => {
      const errors = validateTestimonial(body);
      const fields = Object.keys(errors);
      if (fields.length) return fail(422, errors[fields[0]][0], errors);
      return ok(
        { id: Date.now(), source: 'website', is_featured: false },
        {
          code: 201,
          message: 'Thank you! Your review has been submitted and is pending approval.',
        },
      );
    },
  },
  { method: 'get', pattern: '/stats', handler: ({ lang }) => ok(localize(stats, lang)) },
  {
    method: 'post',
    pattern: '/contact',
    handler: ({ body }) => {
      const errors = validateContact(body);
      const fields = Object.keys(errors);
      if (fields.length) return fail(422, errors[fields[0]][0], errors);
      return ok(
        { id: Date.now(), type: body.type ?? 'general_contact' },
        { code: 201, message: 'Message created successfully' },
      );
    },
  },
];

/**
 * Adds routes in front of the table (they win over existing ones). Used by the
 * test suite to serve the real captured API responses for the live resources.
 * @param {typeof routes} extra
 */
export function registerMockRoutes(extra) {
  routes.unshift(...extra);
}

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
