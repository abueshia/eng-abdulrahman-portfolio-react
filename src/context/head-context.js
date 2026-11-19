import { createContext } from 'react';

/**
 * @typedef {Object} HeadCollector
 * @property {(head: import('@/utils/head').HeadData) => void} collect
 */

/**
 * Present only while prerendering: `<Seo>` reports its head data here during
 * render (effects never run on the server). In the browser it stays `null`
 * and `<Seo>` writes to the DOM instead.
 * @type {import('react').Context<HeadCollector | null>}
 */
export const HeadContext = createContext(null);
