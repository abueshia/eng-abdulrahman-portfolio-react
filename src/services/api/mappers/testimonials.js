import { mapList, optional, text, url } from './shared';

/**
 * `GET /testimonials` (and `testimonials` inside a project) → the app's
 * testimonial shape (API_CONTRACT.md §5). The API lists approved records
 * only; aliases (`client_name`, `client_role`, `testimonial`) are read as
 * fallbacks.
 */

/**
 * @typedef {Object} Testimonial
 * @property {number} id
 * @property {string} name
 * @property {string | null} role
 * @property {string | null} company
 * @property {string} quote
 * @property {number} rating        1..5, 0 when missing or invalid.
 * @property {string | null} avatar Absolute URL, or `null` (generated monogram).
 * @property {boolean} is_featured
 * @property {{ id: number, title: string, slug: string } | null} project
 */

/**
 * @param {any} raw
 * @returns {Testimonial | null}
 */
export function mapTestimonial(raw) {
  const name = text(raw?.name ?? raw?.client_name);
  const quote = text(raw?.description ?? raw?.testimonial);
  if (!name || !quote) return null;
  const rating = Math.round(Number(raw.rating));
  const project = raw.project?.slug
    ? { id: Number(raw.project.id), title: text(raw.project.title), slug: text(raw.project.slug) }
    : null;
  return {
    id: Number(raw.id),
    name,
    role: optional(raw.name_job ?? raw.client_role),
    company: optional(raw.company_name),
    quote,
    rating: rating >= 1 && rating <= 5 ? rating : 0,
    avatar: url(raw.avatar),
    is_featured: raw.is_featured === true,
    project: project?.title ? project : null,
  };
}

export const mapTestimonials = mapList(mapTestimonial);
