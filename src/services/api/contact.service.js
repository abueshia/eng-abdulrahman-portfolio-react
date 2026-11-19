import { ENDPOINTS } from './endpoints';
import { http } from './http';
import { unwrap } from './client';

/**
 * @typedef {Object} ContactPayload
 * @property {string} name
 * @property {string} email
 * @property {string} [phone]
 * @property {string} [type]     Project type value from `settings.contact.project_types`.
 * @property {string} message
 * @property {string} [website]  Honeypot: must stay empty for humans.
 */

/** Contact form submission service. */
export const contactService = {
  /**
   * @param {ContactPayload} payload
   * @returns {Promise<import('./client').ApiResult<{ id: number } | null>>}
   * @throws {import('./errors').ApiError} `isValidation` with field `errors` on 422.
   */
  send: (payload) => unwrap(http.post(ENDPOINTS.contact, payload)),
};
