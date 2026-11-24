/**
 * Laravel API settings: where the API lives, which resources it serves, and
 * what the forms do when theirs is not live.
 *
 * Imported only by lazy code (the axios client, the forms, the prerender
 * entry), so none of it weighs on the initial bundle.
 *
 * - VITE_API_URL: base URL, versioned prefix included.
 * - VITE_API_RESOURCES: comma list of the resources fetched from the API
 *   (projects, experiences, testimonials, faqs, contact). Unset = all five;
 *   "" = none (the test suite). Everything else (settings, services, stats,
 *   about, skills…) is static/mock data in the same build.
 */
import { parseBool } from './env';

/** @typedef {'projects' | 'experiences' | 'testimonials' | 'faqs' | 'contact'} ApiResource */

/** Resources the Laravel API serves (API_CONTRACT.md). */
export const API_RESOURCES = /** @type {const} */ ([
  'projects',
  'experiences',
  'testimonials',
  'faqs',
  'contact',
]);

/**
 * Parses VITE_API_RESOURCES ("projects,faqs"). Unknown names are ignored.
 * @param {string | undefined} value
 * @returns {readonly ApiResource[]}
 */
export function parseResources(value) {
  if (value === undefined) return API_RESOURCES;
  const wanted = String(value)
    .split(',')
    .map((name) => name.trim().toLowerCase());
  return API_RESOURCES.filter((name) => wanted.includes(name));
}

const resources = parseResources(import.meta.env.VITE_API_RESOURCES);

/**
 * @typedef {Object} ApiConfig
 * @property {string} url             Base URL of the Laravel REST API.
 * @property {readonly ApiResource[]} resources  Resources served by the live API.
 * @property {boolean} contactRelay   `contact` is not live and this is a production build: the
 *                                    contact form opens WhatsApp (or email) pre-filled instead of
 *                                    a mock that reaches no one. VITE_CONTACT_RELAY=true|false.
 * @property {boolean} reviewRelay    Same rule for "Write a review" while `testimonials` is not
 *                                    live (the photo is not sent). VITE_REVIEW_RELAY=true|false.
 */

/** @type {ApiConfig} */
export const api = Object.freeze({
  // Production API (API_CONTRACT.md §0): the default, so a fresh checkout shows real data.
  url: (import.meta.env.VITE_API_URL || 'https://eng-abdelrahman.dr-krok.com/api/v1').replace(
    /\/$/,
    '',
  ),
  resources,
  contactRelay:
    !resources.includes('contact') &&
    parseBool(import.meta.env.VITE_CONTACT_RELAY, Boolean(import.meta.env.PROD)),
  reviewRelay:
    !resources.includes('testimonials') &&
    parseBool(import.meta.env.VITE_REVIEW_RELAY, Boolean(import.meta.env.PROD)),
});

/**
 * True when `resource` is fetched from the live API.
 * @param {string} resource
 */
export const isLiveResource = (resource) =>
  /** @type {readonly string[]} */ (api.resources).includes(resource);
