/**
 * "The Visitor Is The Request": the home page is one HTTP request travelling
 * through a live system, and scrolling moves it from station to station:
 *
 *   Gateway (hero) → [Observability (stats)] → Auth (about) → Services
 *   (skills) → Queue (experience) → Database (projects) → Endpoints
 *   (services) → Response 201 (contact)
 *
 * Observability is a *tap*: monitoring watches the request go by without
 * routing it, so it is a stop on the route trace but never a forwarding
 * target (the hero still forwards the request to /auth).
 *
 * Sections between stations (credentials, faq…) are "in transit": they
 * inherit the previous station. A hidden section simply removes its station
 * from the route (the journey is measured from the DOM, not assumed).
 *
 * `scene` drives the global background light. Coordinates are percentages of
 * the viewport measured from the inline-start edge (mirrored in RTL);
 * `s` is scale and `a` opacity. Ember = request (back end), Ion = response
 * (front end): the light shifts from Ember to Ion as the request turns into
 * the response.
 */
import { SECTION_IDS } from './routes';

/**
 * @typedef {Object} GlowScene
 * @property {number} x
 * @property {number} y
 * @property {number} s
 * @property {number} a
 *
 * @typedef {Object} Station
 * @property {string} id
 * @property {string} section  Home section id that hosts the station.
 * @property {string} code     Two-digit ordinal shown in the route trace.
 * @property {boolean} [tap]    Passive station (observes, never forwards).
 * @property {{ ember: GlowScene, ion: GlowScene, grid: number }} scene
 */

/** @type {ReadonlyArray<Station>} */
export const STATIONS = Object.freeze([
  {
    id: 'gateway',
    section: SECTION_IDS.hero,
    code: '01',
    scene: {
      ember: { x: -14, y: 58, s: 1, a: 0.9 },
      ion: { x: 66, y: -24, s: 0.9, a: 0.55 },
      grid: 1,
    },
  },
  {
    id: 'observability',
    section: SECTION_IDS.stats,
    code: '02',
    tap: true,
    scene: {
      ember: { x: 16, y: 70, s: 0.7, a: 0.38 },
      ion: { x: 78, y: 8, s: 1.1, a: 0.6 },
      grid: 1.15,
    },
  },
  {
    id: 'auth',
    section: SECTION_IDS.about,
    code: '03',
    scene: {
      ember: { x: 6, y: 18, s: 0.8, a: 0.6 },
      ion: { x: 72, y: 46, s: 1.05, a: 0.5 },
      grid: 0.75,
    },
  },
  {
    id: 'services',
    section: SECTION_IDS.skills,
    code: '04',
    scene: {
      ember: { x: 58, y: 52, s: 1.15, a: 0.75 },
      ion: { x: -12, y: -6, s: 0.85, a: 0.45 },
      grid: 0.9,
    },
  },
  {
    id: 'queue',
    section: SECTION_IDS.experience,
    code: '05',
    scene: {
      ember: { x: -22, y: 26, s: 0.95, a: 0.6 },
      ion: { x: 44, y: 74, s: 0.8, a: 0.45 },
      grid: 0.6,
    },
  },
  {
    id: 'database',
    section: SECTION_IDS.projects,
    code: '06',
    scene: {
      ember: { x: 30, y: 82, s: 1.35, a: 0.7 },
      ion: { x: 76, y: -4, s: 0.75, a: 0.35 },
      grid: 0.5,
    },
  },
  {
    // The services, published as API contracts: the request reaches the
    // public surface it was routed to, right before it turns into a response.
    id: 'endpoints',
    section: SECTION_IDS.services,
    code: '07',
    scene: {
      ember: { x: 88, y: 24, s: 0.9, a: 0.55 },
      ion: { x: 8, y: 78, s: 1.05, a: 0.55 },
      grid: 1.25,
    },
  },
  {
    id: 'response',
    section: SECTION_IDS.contact,
    code: '08',
    scene: {
      ember: { x: 82, y: 92, s: 0.6, a: 0.22 },
      ion: { x: 18, y: 30, s: 1.4, a: 0.9 },
      grid: 0.9,
    },
  },
]);

const BY_SECTION = new Map(STATIONS.map((station) => [station.section, station]));
const BY_ID = new Map(STATIONS.map((station) => [station.id, station]));
const SECTION_ORDER = Object.values(SECTION_IDS);

/**
 * @param {string | null | undefined} id
 * @returns {Station | undefined}
 */
export const getStation = (id) => (id ? BY_ID.get(id) : undefined);

/**
 * Station a home section belongs to: its own, or the closest one before it.
 * @param {string} sectionId
 * @returns {string | undefined}
 */
export function stationForSection(sectionId) {
  const index = SECTION_ORDER.indexOf(sectionId);
  for (let i = index; i >= 0; i -= 1) {
    const station = BY_SECTION.get(SECTION_ORDER[i]);
    if (station) return station.id;
  }
  return undefined;
}

/**
 * Whether the section is where a station begins (a route-trace stop).
 * @param {string} sectionId
 */
export const isStationAnchor = (sectionId) => BY_SECTION.has(sectionId);

/**
 * First station after `from` that the request is forwarded to (taps skipped).
 * @param {Array<{ id: string }>} stops Route stops in order.
 * @param {string} from
 * @returns {string | undefined}
 */
export function nextForwardStation(stops, from) {
  const start = stops.findIndex((stop) => stop.id === from);
  return stops.slice(start + 1).find((stop) => !BY_ID.get(stop.id)?.tap)?.id;
}

/** Station whose light the page uses when no journey is being tracked (inner pages). */
export const DEFAULT_STATION = 'gateway';
