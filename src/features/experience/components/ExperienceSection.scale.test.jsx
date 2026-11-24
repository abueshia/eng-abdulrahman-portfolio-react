/**
 * The git-log timeline with real API records at different sizes (1, 2, 4, 8)
 * and long texts, and the director's contract: it rebuilds its scroll
 * triggers whenever the rendered log changes (data arriving after mount).
 */
import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { experiencesService } from '@/services/api';
import { mapExperiences } from '@/services/api/mappers/experiences';
import { renderWithProviders } from '@/test/renderWithProviders';
import experiencesEn from '../../../../docs/api-fixtures/experiences.index.en.json';
import { buildGitGraph } from '../lib/git-log';
import ExperienceSection from './ExperienceSection';

const directorDeps = vi.hoisted(() => /** @type {unknown[][]} */ ([]));
vi.mock('@/lib/use-director', () => ({
  sectionTrigger: () => ({}),
  useDirector: (/** @type {unknown} */ _build, /** @type {{ deps?: unknown[] }} */ options) => {
    directorDeps.push(options.deps ?? []);
  },
}));
vi.mock('@/lib/gsap', () => ({ gsap: {} }));

const LONG = 'Designed, built and operated a multi-tenant platform end to end. '.repeat(12).trim();

/**
 * `count` real API records (cycled, with unique ids and staggered dates),
 * the last one with long texts, mapped exactly like the service does.
 * @param {number} count
 */
function records(count) {
  const raw = Array.from({ length: count }, (_, i) => {
    const source = experiencesEn.data[i % experiencesEn.data.length];
    const year = 2010 + i;
    const long = i === count - 1;
    return {
      ...source,
      id: 100 + i,
      start_date: `${year}-01-01`,
      end_date: source.is_current ? null : `${year}-12-01`,
      summary: long ? LONG : source.summary,
      achievements: long ? `- ${LONG}\n• Second line\n\n` : source.achievements,
    };
  });
  return mapExperiences(raw);
}

afterEach(() => {
  vi.restoreAllMocks();
  directorDeps.length = 0;
});

describe('Experience timeline at different sizes (real API records)', () => {
  it.each([1, 2, 4, 8])(
    'renders %i record(s): one commit each, every achievement line',
    async (count) => {
      const data = records(count);
      vi.spyOn(experiencesService, 'list').mockResolvedValue({
        data,
        message: 'OK',
        code: 200,
        pagination: undefined,
      });
      const { container } = renderWithProviders(<ExperienceSection />, { initialEntries: ['/en'] });
      await screen.findAllByText(data[0].role, { exact: false });

      const section = /** @type {HTMLElement} */ (container.querySelector('#experience'));
      expect(section.querySelectorAll('article')).toHaveLength(count);
      const lines = data.reduce((sum, item) => sum + item.achievements.length, 0);
      expect(section.querySelectorAll('.gl__add')).toHaveLength(lines);
      // Long texts stay whole text (no truncation), list markers stripped.
      expect(section).toHaveTextContent(LONG);
      expect(section.textContent).not.toContain('- Designed');
      // The graph has a row per commit plus one merge row per running side branch.
      const graph = buildGitGraph(data);
      expect(section.querySelectorAll('[data-gl-row]')).toHaveLength(graph.rows.length);
      expect(graph.rows.filter((row) => row.head)).toHaveLength(1);
    },
  );

  it('renders nothing broken with an empty list', async () => {
    vi.spyOn(experiencesService, 'list').mockResolvedValue({
      data: [],
      message: 'OK',
      code: 200,
      pagination: undefined,
    });
    const { container } = renderWithProviders(<ExperienceSection />, { initialEntries: ['/en'] });
    await screen.findByRole('heading', { level: 2 });
    expect(container.querySelectorAll('#experience article')).toHaveLength(0);
  });
});

describe('ExperienceDirector', () => {
  it('rebuilds its triggers when the rendered log changes', async () => {
    const { default: ExperienceDirector } = await import('../fx/ExperienceDirector');
    const { rerender } = renderWithProviders(<ExperienceDirector graphKey="commit-1" />, {
      initialEntries: ['/en'],
    });
    rerender(<ExperienceDirector graphKey="commit-1,commit-2" />);
    const keys = directorDeps.map((deps) => deps[1]);
    expect(keys).toContain('commit-1');
    expect(keys.at(-1)).toBe('commit-1,commit-2');
  });
});
