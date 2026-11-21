/**
 * Case-file filters: pure helpers shared by the projects section and its tests.
 *
 * Filter state lives in the URL query (`?type=saas&tech=laravel`), so a
 * filtered view can be shared. The semantics mirror the API's `type` and
 * `technology` params; the list is small enough to filter client-side, which
 * keeps every record mounted for the FLIP transition.
 */

/** Query-string keys. */
export const FILTER_PARAMS = Object.freeze({ type: 'type', tech: 'tech' });

/**
 * @typedef {{ type: string | null, tech: string | null }} ProjectFilters
 * @typedef {{ slug: string, type: string, technologies?: Array<{ slug: string, name: string }> }} FilterableProject
 */

/** @type {ProjectFilters} */
export const NO_FILTERS = Object.freeze({ type: null, tech: null });

const SLUG = /^[a-z0-9][a-z0-9-]{0,40}$/;
const clean = (/** @type {string | null} */ value) => (value && SLUG.test(value) ? value : null);

/**
 * Reads filters from URL search params. Unknown or malformed values are
 * ignored rather than producing an empty, confusing list.
 * @param {URLSearchParams} params
 * @param {{ types: string[], techs: string[] }} [allowed] Known facet values.
 * @returns {ProjectFilters}
 */
export function parseFilters(params, allowed) {
  const type = clean(params.get(FILTER_PARAMS.type));
  const tech = clean(params.get(FILTER_PARAMS.tech));
  return {
    type: type && (!allowed || allowed.types.includes(type)) ? type : null,
    tech: tech && (!allowed || allowed.techs.includes(tech)) ? tech : null,
  };
}

/**
 * Writes filters into a copy of the current params (other keys survive).
 * @param {URLSearchParams} params
 * @param {ProjectFilters} filters
 */
export function withFilters(params, filters) {
  const next = new URLSearchParams(params);
  for (const key of /** @type {Array<keyof ProjectFilters>} */ (['type', 'tech'])) {
    if (filters[key]) next.set(FILTER_PARAMS[key], /** @type {string} */ (filters[key]));
    else next.delete(FILTER_PARAMS[key]);
  }
  return next;
}

/**
 * @template {FilterableProject} T
 * @param {T[]} projects
 * @param {ProjectFilters} filters
 * @returns {T[]}
 */
export function filterProjects(projects, filters) {
  return projects.filter(
    (project) =>
      (!filters.type || project.type === filters.type) &&
      (!filters.tech || (project.technologies ?? []).some((t) => t.slug === filters.tech)),
  );
}

/**
 * Facet values present in the data, with counts. Technologies used by a
 * single project only are kept: the list is short and every chip is real.
 * @param {FilterableProject[]} projects
 */
export function facets(projects) {
  /** @type {Map<string, number>} */
  const types = new Map();
  /** @type {Map<string, { slug: string, name: string, count: number }>} */
  const techs = new Map();
  for (const project of projects) {
    types.set(project.type, (types.get(project.type) ?? 0) + 1);
    for (const tech of project.technologies ?? []) {
      const entry = techs.get(tech.slug) ?? { slug: tech.slug, name: tech.name, count: 0 };
      entry.count += 1;
      techs.set(tech.slug, entry);
    }
  }
  return {
    types: [...types].map(([slug, count]) => ({ slug, count })),
    techs: [...techs.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
  };
}

/**
 * The SQL the filter state "runs" (shown above the case files).
 * @param {ProjectFilters} filters
 */
export function describeQuery(filters) {
  const where = [
    filters.type && `type = '${filters.type}'`,
    filters.tech && `'${filters.tech}' IN stack`,
  ].filter(Boolean);
  return `SELECT * FROM projects${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY year DESC;`;
}

/** Stable key for a filter state (animation and director re-runs). */
export const filtersKey = (/** @type {ProjectFilters} */ filters) =>
  `${filters.type ?? '*'}|${filters.tech ?? '*'}`;
