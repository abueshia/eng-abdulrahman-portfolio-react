/**
 * Review relay: only for builds where `testimonials` is not a live API
 * resource (VITE_API_RESOURCES). Submitting then opens WhatsApp (or the mail
 * app without a WhatsApp number) with the review pre-filled, exactly like the
 * contact form. The photo cannot travel in a link, and the form says so
 * before sending. Pure helpers; the decision lives in `api.reviewRelay`.
 */

/**
 * @typedef {Object} ReviewRelayLabels
 * @property {string} greeting  "Hello, I'm {{name}}…" with the name already filled.
 * @property {string} role
 * @property {string} rating    "Rating: {{value}}/5"-style label, value already filled.
 */

/**
 * Plain-text WhatsApp/email body from a review payload (no photo).
 * @param {import('./review-schema').ReviewPayload} payload
 * @param {ReviewRelayLabels} labels
 * @returns {string}
 */
export function reviewRelayMessage(payload, labels) {
  const stars = '★'.repeat(payload.rating) + '☆'.repeat(Math.max(0, 5 - payload.rating));
  const who = [payload.name_job, payload.company_name].filter(Boolean).join(' · ');
  return [
    labels.greeting,
    ...(who ? [`${labels.role}: ${who}`] : []),
    `${labels.rating} ${stars}`,
    '',
    payload.description,
  ].join('\n');
}
