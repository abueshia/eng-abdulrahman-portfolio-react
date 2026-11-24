import { isoDate, lines, mapList, mapTechnologies, optional, text, url } from './shared';

/**
 * `GET /experiences` → the app's experience shape (API_CONTRACT.md §4).
 * `achievements` arrives as one string with `\n` separators (or, from older
 * builds, an array): it always leaves here as clean list items.
 */

/**
 * @typedef {Object} Experience
 * @property {number} id
 * @property {string} company
 * @property {string} role
 * @property {string} employment_type
 * @property {string} employment_label  Localised by the API.
 * @property {string | null} location
 * @property {string} start_date        YYYY-MM-DD
 * @property {string | null} end_date   `null` while current.
 * @property {boolean} is_current
 * @property {string} summary
 * @property {string[]} achievements
 * @property {string | null} company_url
 * @property {import('./shared').Technology[]} technologies
 */

/**
 * @param {any} raw
 * @returns {Experience | null}
 */
export function mapExperience(raw) {
  const company = text(raw?.company_name);
  const role = text(raw?.role_title);
  const start = isoDate(raw?.start_date);
  if (!company || !role || !start) return null;
  const isCurrent = raw.is_current === true;
  return {
    id: Number(raw.id),
    company,
    role,
    employment_type: text(raw.employment_type),
    employment_label: text(raw.employment_type_label),
    location: optional(raw.location),
    start_date: start,
    end_date: isCurrent ? null : isoDate(raw.end_date),
    is_current: isCurrent,
    summary: text(raw.summary),
    achievements: lines(raw.achievements ?? raw.highlights),
    company_url: url(raw.company_url),
    technologies: mapTechnologies(raw.technologies),
  };
}

export const mapExperiences = mapList(mapExperience);
