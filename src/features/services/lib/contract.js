/**
 * Services as API contracts: pure helpers (grouping, endpoint paths, the
 * JSON response a contract "returns").
 */

/**
 * @typedef {{ slug: string, name: string, sort?: number }} ServiceGroup
 * @typedef {{ id: number, slug: string, method: string, title: string, description: string,
 *   deliverables: string[], stack?: string[], group: ServiceGroup | null }} Service
 */

/** Endpoint path of a service, e.g. `/services/payment-integration`. */
export const endpointPath = (/** @type {{ slug: string }} */ service) =>
  `/services/${service.slug}`;

/**
 * Groups services in their API order (the API sorts by group, then id).
 * Services without a group land in a trailing "other" group.
 * @param {Service[]} services
 * @returns {Array<{ group: ServiceGroup, services: Service[] }>}
 */
export function groupServices(services) {
  /** @type {Map<string, { group: ServiceGroup, services: Service[] }>} */
  const groups = new Map();
  for (const service of services) {
    const group = service.group ?? { slug: 'other', name: 'Other' };
    if (!groups.has(group.slug)) groups.set(group.slug, { group, services: [] });
    groups.get(group.slug)?.services.push(service);
  }
  return [...groups.values()];
}

/**
 * The response body a contract returns, as ordered `[key, value]` pairs so
 * the UI can print it as JSON while keeping every value real text.
 * @param {Service} service
 * @returns {Array<[string, string | string[]]>}
 */
export function responseFields(service) {
  /** @type {Array<[string, string | string[]]>} */
  const fields = [
    ['service', service.slug],
    ['deliverables', service.deliverables ?? []],
  ];
  if (service.stack?.length) fields.push(['stack', service.stack]);
  return fields;
}
