/**
 * Resource mappers: API response → the app's internal shapes. Loaded lazily by
 * the services (with axios, on the first real request), so they never weigh
 * on the initial bundle; prerendered pages hydrate from already-mapped data.
 */
export { collectPages, mapResult } from './shared';
export { mapProject, mapProjects } from './projects';
export { mapExperiences } from './experiences';
export { mapTestimonial, mapTestimonials } from './testimonials';
export { mapFaqs } from './faqs';
