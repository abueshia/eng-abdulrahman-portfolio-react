import { describe, expect, it } from 'vitest';

import {
  NO_FILTERS,
  describeQuery,
  facets,
  filterProjects,
  filtersKey,
  parseFilters,
  withFilters,
} from './filters';

const laravel = { slug: 'laravel', name: 'Laravel' };
const PROJECTS = [
  { slug: 'a', type: 'saas', technologies: [laravel, { slug: 'react', name: 'React' }] },
  { slug: 'b', type: 'pos', technologies: [laravel] },
  { slug: 'c', type: 'api', technologies: [{ slug: 'redis', name: 'Redis' }] },
];

describe('project filters', () => {
  it('reads the URL query, ignoring unknown or malformed values', () => {
    const allowed = { types: ['saas', 'pos', 'api'], techs: ['laravel', 'redis'] };
    expect(parseFilters(new URLSearchParams('type=pos&tech=laravel'), allowed)).toEqual({
      type: 'pos',
      tech: 'laravel',
    });
    expect(parseFilters(new URLSearchParams('type=nope&tech=%3Cscript%3E'), allowed)).toEqual(
      NO_FILTERS,
    );
    expect(parseFilters(new URLSearchParams(''))).toEqual(NO_FILTERS);
  });

  it('writes filters back without touching other params', () => {
    const next = withFilters(new URLSearchParams('utm=x&type=saas'), { type: null, tech: 'redis' });
    expect(next.toString()).toBe('utm=x&tech=redis');
  });

  it('filters by type and technology like the API does', () => {
    const slugs = (/** @type {typeof PROJECTS} */ list) => list.map((p) => p.slug);
    expect(filterProjects(PROJECTS, NO_FILTERS)).toHaveLength(3);
    expect(slugs(filterProjects(PROJECTS, { type: null, tech: 'laravel' }))).toEqual(['a', 'b']);
    expect(slugs(filterProjects(PROJECTS, { type: 'pos', tech: 'laravel' }))).toEqual(['b']);
    expect(filterProjects(PROJECTS, { type: 'api', tech: 'laravel' })).toEqual([]);
  });

  it('builds facets from the data, most used technology first', () => {
    const result = facets(PROJECTS);
    expect(result.types.map((t) => t.slug)).toEqual(['saas', 'pos', 'api']);
    expect(result.techs[0]).toEqual({ slug: 'laravel', name: 'Laravel', count: 2 });
  });

  it('describes the query the filter state runs', () => {
    expect(describeQuery(NO_FILTERS)).toBe('SELECT * FROM projects ORDER BY sort_order;');
    expect(describeQuery({ type: 'saas', tech: 'react' })).toBe(
      "SELECT * FROM projects WHERE type = 'saas' AND 'react' IN stack ORDER BY sort_order;",
    );
    expect(filtersKey({ type: 'saas', tech: null })).toBe('saas|*');
  });
});
