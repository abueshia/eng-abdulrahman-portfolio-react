/**
 * API route names. Mirrors the Laravel `routes/api.php` contract so switching
 * from mock to live is a configuration change only.
 */
export const ENDPOINTS = Object.freeze({
  settings: '/settings',
  home: '/home',
  projects: '/projects',
  project: (/** @type {string} */ slug) => `/projects/${encodeURIComponent(slug)}`,
  technologies: '/technologies',
  experiences: '/experiences',
  credentials: '/credentials',
  services: '/services',
  testimonials: '/testimonials',
  blogs: '/blogs',
  blogCategories: '/blogs/categories',
  blog: (/** @type {string} */ slug) => `/blogs/${encodeURIComponent(slug)}`,
  faqs: '/faqs',
  stats: '/stats',
  contact: '/contact',
});
