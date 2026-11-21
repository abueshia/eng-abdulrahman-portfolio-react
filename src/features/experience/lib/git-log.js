/**
 * The career as `git log --graph`: pure layout of the commit graph, shared by
 * the prerenderer and the browser.
 *
 * - Every role is a commit; its company is the branch ref.
 * - Employed roles run on `main` (lane 0). Side work (freelance) is its own
 *   lane: it forks from the main commit before it started and merges back:
 *   into the first main commit that started after it ended, or, while it is
 *   still running, through a merge commit at the top of the log.
 * - Newest first, like `git log`.
 *
 * Each row describes what to draw in its own gutter (rows have different
 * heights, so the graph is drawn per row and joins seamlessly):
 *  - `segments`: straight lane pieces, `from` top | node | curve, `to` node | bottom;
 *  - `curves`: a fork (side node → main, below) or a merge (side, below → main node).
 */

/** Employment types drawn as side branches. */
export const SIDE_TYPES = new Set(['freelance']);

/**
 * @typedef {{ id: number | string, company: string, role: string, employment_type?: string,
 *   start_date: string, end_date?: string | null, is_current?: boolean }} Experience
 *
 * @typedef {{ lane: number, from: 'top' | 'node' | 'curve', to: 'node' | 'bottom' }} Segment
 * @typedef {{ kind: 'fork' | 'merge', lane: number }} Curve  `lane`: the side lane joining main.
 *
 * @typedef {Object} GraphRow
 * @property {'commit' | 'merge'} kind
 * @property {string} key
 * @property {number} lane       Lane of this row's node.
 * @property {string} hash       Short hash (deterministic).
 * @property {string} branch     Branch ref of the commit (or the merged branch).
 * @property {boolean} head      Top of the log (HEAD -> main).
 * @property {Experience | null} experience
 * @property {Segment[]} segments
 * @property {Curve[]} curves
 *
 * @typedef {{ rows: GraphRow[], lanes: number }} GitGraph
 */

/**
 * FNV-1a → 7 hex chars: a stable, git-like short hash.
 * @param {string} seed
 */
export function shortHash(seed) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0').slice(0, 7);
}

/**
 * Branch-ref style name: lowercase, words joined by "-", any script.
 * @param {string} name
 */
export const branchName = (name) =>
  String(name)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');

/**
 * "2024-03-01" → "2024·03". Formatted by hand: `Intl` month names can differ
 * between the build machine and the browser and would break hydration.
 * @param {string | null | undefined} iso
 */
export const formatMonth = (iso) => (iso ? `${iso.slice(0, 4)}·${iso.slice(5, 7)}` : '');

/**
 * Whole months between two ISO dates (end inclusive of its month), only for
 * finished roles: a running role's length depends on "today", which the
 * prerender cannot know.
 * @param {string} start
 * @param {string} end
 * @returns {{ years: number, months: number }}
 */
export function tenure(start, end) {
  const months =
    (Number(end.slice(0, 4)) - Number(start.slice(0, 4))) * 12 +
    (Number(end.slice(5, 7)) - Number(start.slice(5, 7))) +
    1;
  return { years: Math.floor(months / 12), months: months % 12 };
}

/**
 * @param {Experience[]} experiences
 * @returns {GitGraph}
 */
export function buildGitGraph(experiences) {
  const items = [...experiences].sort((a, b) => b.start_date.localeCompare(a.start_date));
  const sides = items.filter((e) => SIDE_TYPES.has(e.employment_type ?? ''));
  const laneOf = new Map(sides.map((e, i) => [e.id, i + 1]));

  /** @type {GraphRow[]} */
  const rows = [];
  // Running side work merges through a merge commit at the top of the log.
  const openSides = sides.filter((e) => e.is_current || !e.end_date);
  for (const side of openSides) {
    const branch = branchName(side.company);
    rows.push({
      kind: 'merge',
      key: `merge-${side.id}`,
      lane: 0,
      hash: shortHash(`merge:${side.id}:${side.start_date}`),
      branch,
      head: false,
      experience: null,
      segments: [],
      curves: [],
    });
  }
  for (const experience of items) {
    rows.push({
      kind: 'commit',
      key: `commit-${experience.id}`,
      lane: laneOf.get(experience.id) ?? 0,
      hash: shortHash(`${experience.id}:${experience.start_date}:${experience.role}`),
      branch: branchName(experience.company),
      head: false,
      experience,
      segments: [],
      curves: [],
    });
  }
  if (rows.length === 0) return { rows, lanes: 1 };
  rows[0].head = true;

  // Main line: from its first node to its last node.
  const mainRows = rows.map((row, i) => (row.lane === 0 ? i : -1)).filter((i) => i >= 0);
  const firstMain = mainRows[0];
  const lastMain = mainRows[mainRows.length - 1];
  rows.forEach((row, i) => {
    if (i < firstMain || i > lastMain || firstMain === lastMain) return;
    row.segments.push({
      lane: 0,
      from: i === firstMain ? 'node' : 'top',
      to: i === lastMain ? 'node' : 'bottom',
    });
  });

  // Side lanes: from the merge row down to the side commit, forking off main.
  for (const side of sides) {
    const lane = /** @type {number} */ (laneOf.get(side.id));
    const commitRow = rows.findIndex((row) => row.experience?.id === side.id);
    let mergeRow = rows.findIndex((row) => row.key === `merge-${side.id}`);
    if (mergeRow < 0) {
      // Finished: merges into the oldest main commit that started after it ended.
      const end = side.end_date ?? '';
      for (let i = commitRow - 1; i >= 0; i -= 1) {
        if (rows[i].lane === 0 && rows[i].experience && rows[i].experience.start_date > end) {
          mergeRow = i;
          break;
        }
      }
    }
    if (mergeRow >= 0) {
      rows[mergeRow].curves.push({ kind: 'merge', lane });
      rows[mergeRow].segments.push({ lane, from: 'curve', to: 'bottom' });
      if (rows[mergeRow].kind === 'merge') rows[mergeRow].branch = branchName(side.company);
    }
    for (let i = Math.max(mergeRow + 1, 0); i < commitRow; i += 1) {
      rows[i].segments.push({ lane, from: 'top', to: 'bottom' });
    }
    const hasParent = rows.slice(commitRow + 1).some((row) => row.lane === 0);
    if (mergeRow >= 0) rows[commitRow].segments.push({ lane, from: 'top', to: 'node' });
    if (hasParent) rows[commitRow].curves.push({ kind: 'fork', lane });
  }

  return { rows, lanes: sides.length + 1 };
}
