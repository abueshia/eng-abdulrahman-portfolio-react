import { describe, expect, it } from 'vitest';

import { branchName, buildGitGraph, formatMonth, shortHash, tenure } from './git-log';

/** Same shape as the mock timeline: A (current), B, freelance (current), C. */
const experiences = [
  {
    id: 1,
    company: 'Sample Company A',
    role: 'Senior',
    employment_type: 'full_time',
    start_date: '2024-03-01',
    end_date: null,
    is_current: true,
  },
  {
    id: 2,
    company: 'Sample Company B',
    role: 'Engineer',
    employment_type: 'full_time',
    start_date: '2022-06-01',
    end_date: '2024-02-28',
  },
  {
    id: 3,
    company: 'Freelance (sample)',
    role: 'Independent',
    employment_type: 'freelance',
    start_date: '2021-09-01',
    end_date: null,
    is_current: true,
  },
  {
    id: 4,
    company: 'Sample Company C',
    role: 'Junior',
    employment_type: 'full_time',
    start_date: '2021-01-01',
    end_date: '2022-05-31',
  },
];

describe('git log graph', () => {
  const { rows, lanes } = buildGitGraph(experiences);

  it('lists newest first, with running side work merged at the top', () => {
    expect(rows.map((r) => r.key)).toEqual([
      'merge-3',
      'commit-1',
      'commit-2',
      'commit-3',
      'commit-4',
    ]);
    expect(lanes).toBe(2);
    expect(rows[0]).toMatchObject({
      kind: 'merge',
      head: true,
      branch: 'freelance-sample',
      lane: 0,
    });
    expect(rows.find((r) => r.key === 'commit-3')?.lane).toBe(1);
  });

  it('draws main from its first node to its last, through every row', () => {
    const main = rows.map((r) => r.segments.find((s) => s.lane === 0));
    expect(main[0]).toEqual({ lane: 0, from: 'node', to: 'bottom' });
    expect(main[2]).toEqual({ lane: 0, from: 'top', to: 'bottom' });
    expect(main[4]).toEqual({ lane: 0, from: 'top', to: 'node' });
  });

  it('forks the side branch off main and merges it back', () => {
    expect(rows[0].curves).toEqual([{ kind: 'merge', lane: 1 }]);
    expect(rows[0].segments).toContainEqual({ lane: 1, from: 'curve', to: 'bottom' });
    expect(rows[1].segments).toContainEqual({ lane: 1, from: 'top', to: 'bottom' });
    expect(rows[3].segments).toContainEqual({ lane: 1, from: 'top', to: 'node' });
    expect(rows[3].curves).toEqual([{ kind: 'fork', lane: 1 }]);
  });

  it('merges finished side work into the first main commit after it ended', () => {
    const finished = buildGitGraph([
      { id: 'a', company: 'Next', role: 'r', start_date: '2023-01-01' },
      {
        id: 'f',
        company: 'Gig',
        role: 'r',
        employment_type: 'freelance',
        start_date: '2021-01-01',
        end_date: '2022-06-30',
      },
      { id: 'b', company: 'First', role: 'r', start_date: '2020-01-01', end_date: '2022-12-31' },
    ]);
    expect(finished.rows.map((r) => r.key)).toEqual(['commit-a', 'commit-f', 'commit-b']);
    expect(finished.rows[0].curves).toEqual([{ kind: 'merge', lane: 1 }]);
  });

  it('formats refs, hashes and dates deterministically', () => {
    expect(branchName('Sample Company A')).toBe('sample-company-a');
    expect(branchName('شركة نموذجية (أ)')).toBe('شركة-نموذجية-أ');
    expect(shortHash('x')).toMatch(/^[0-9a-f]{7}$/);
    expect(shortHash('x')).toBe(shortHash('x'));
    expect(formatMonth('2024-03-01')).toBe('2024·03');
    expect(tenure('2022-06-01', '2024-02-28')).toEqual({ years: 1, months: 9 });
  });
});
