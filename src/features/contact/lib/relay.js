/**
 * Contact relay: while a production build still runs on the mock adapter
 * (the Laravel `POST /contact` is not connected yet), the form must not be a
 * dead end. Instead of a mock that reaches no one, submitting opens WhatsApp
 * (or, without a WhatsApp number, the visitor's mail app) with a message
 * pre-filled from the form fields. The visitor sends it themselves.
 *
 * Pure helpers (plus `openRelay`, called from event handlers); the decision
 * lives in `env.contactRelay`. The review form reuses them (`env.reviewRelay`).
 */

/**
 * @typedef {Object} RelayLabels
 * @property {string} greeting  e.g. "Hello, I'm {{name}}." with the name already filled.
 * @property {string} email
 * @property {string} phone
 * @property {string} type
 */

/**
 * Plain-text message from a contact payload.
 * @param {ReturnType<typeof import('./schema').toPayload>} payload
 * @param {RelayLabels} labels
 * @param {string} [typeLabel] Human label of `payload.type`.
 * @returns {string}
 */
export function relayMessage(payload, labels, typeLabel) {
  return [
    labels.greeting,
    `${labels.email}: ${payload.email}`,
    ...(payload.phone ? [`${labels.phone}: ${payload.phone}`] : []),
    ...(payload.type ? [`${labels.type}: ${typeLabel || payload.type}`] : []),
    '',
    payload.message,
  ].join('\n');
}

/**
 * The international number in a WhatsApp link or phone value ("201…"), or null.
 * @param {string | undefined} value e.g. "https://wa.me/201028292449" or "+20 102…".
 * @returns {string | null}
 */
export function whatsappNumber(value) {
  if (!value) return null;
  const fromLink = value.match(/wa\.me\/(\d{8,15})/)?.[1];
  if (fromLink) return fromLink;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

/**
 * Where the relayed message goes: WhatsApp when a number exists, else email.
 * @param {{ whatsapp?: string, email?: string, subject: string }} target
 * @param {string} message
 * @returns {{ channel: 'whatsapp' | 'email', url: string } | null}
 */
export function relayTarget({ whatsapp, email, subject }, message) {
  const number = whatsappNumber(whatsapp);
  if (number) {
    return {
      channel: 'whatsapp',
      url: `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
    };
  }
  if (email) {
    const query = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    return { channel: 'email', url: `mailto:${email}?${query}` };
  }
  return null;
}

/**
 * Opens the relay URL. A blocked pop-up falls back to navigating there
 * (wa.me hands over to the app; mailto: never leaves the page).
 * Event handlers only (touches `window`).
 * @param {{ channel: 'whatsapp' | 'email', url: string }} target
 */
export function openRelay(target) {
  if (target.channel === 'email') {
    window.location.href = target.url;
    return;
  }
  const opened = window.open(target.url, '_blank');
  if (opened) opened.opener = null;
  else window.location.assign(target.url);
}
