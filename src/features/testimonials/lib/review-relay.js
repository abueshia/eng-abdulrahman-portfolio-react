/**
 * Review relay: while a production build still runs on the mock adapter
 * (no Laravel `POST /testimonials` yet), submitting opens WhatsApp (or the
 * mail app without a WhatsApp number) with the review pre-filled, exactly
 * like the contact form. The photo cannot travel in a link, and the form
 * says so before sending. Pure helpers; the decision lives in `env.reviewRelay`.
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
  return [
    labels.greeting,
    `${labels.role}: ${payload.role}${payload.company ? ` · ${payload.company}` : ''}`,
    `${labels.rating} ${stars}`,
    '',
    payload.message,
  ].join('\n');
}
