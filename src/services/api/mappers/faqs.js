import { mapList, optional, text } from './shared';

/**
 * `GET /faqs` → the app's FAQ shape (API_CONTRACT.md §6). The same records
 * feed the visible `man faq` section and the FAQPage JSON-LD.
 */

/**
 * @typedef {Object} Faq
 * @property {number} id
 * @property {string} question
 * @property {string} answer
 * @property {string | null} category
 */

/**
 * @param {any} raw
 * @returns {Faq | null}
 */
export function mapFaq(raw) {
  const question = text(raw?.question);
  const answer = text(raw?.answer);
  if (!question || !answer) return null;
  return { id: Number(raw.id), question, answer, category: optional(raw.category) };
}

export const mapFaqs = mapList(mapFaq);
