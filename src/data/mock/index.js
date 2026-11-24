/**
 * Mock data barrel. Only the mock adapter should import from here; UI code
 * always goes through `services/api`.
 *
 * Projects, experiences, testimonials and FAQs have no mock data: they come
 * from the Laravel API (VITE_API_RESOURCES). Tests serve them from the real
 * captured responses in docs/api-fixtures (src/test/api-fixtures.js).
 */
export { settings } from './settings';
export { technologies, technologyCategories } from './technologies';
export { credentials } from './credentials';
export { services, serviceGroups } from './services';
export { stats } from './stats';
