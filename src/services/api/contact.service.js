import { ENDPOINTS } from './endpoints';
import { http } from './http';
import { unwrap } from './client';

/**
 * @typedef {Object} ContactPayload  `POST /contact` body (API_CONTRACT.md §7).
 * @property {string} name
 * @property {string} email
 * @property {string} message
 * @property {string} [phone]
 * @property {string} [service]  The chosen project type, as its human label.
 * @property {'general_contact' | 'project_inquiry' | 'job_offer' | 'consultation'} type
 * @property {string} [website]  Honeypot: must stay empty for humans (never sent).
 */

/** Contact form submission service. */
export const contactService = {
  /**
   * @param {ContactPayload} payload
   * @returns {Promise<import('./client').ApiResult<unknown>>}
   * @throws {import('./errors').ApiError} `isValidation` (field `errors`), `isRateLimited` (429).
   */
  send: async ({ website, ...body }) => {
    // Honeypot filled (a bot): look accepted, send nothing.
    if (website) return { data: null, message: '', code: 201, pagination: undefined };
    return unwrap(http.post(ENDPOINTS.contact, body));
  },
};
