import { describe, expect, it } from 'vitest';

import { buildProjectJsonLd } from './structured-data';

const LABELS = { home: 'Home', work: 'Work' };
const project = {
  slug: 'real-project',
  title: 'Real Project',
  summary: 'What it is.',
  cover_image: '/images/projects/real-project/cover.webp',
  completed_at: '2026-01-10',
  category: { id: 1, slug: 'enterprise-saas', name: 'Enterprise SaaS' },
  technologies: [{ slug: 'laravel', name: 'Laravel' }],
  github_url: null,
  live_url: 'https://example.com',
};

describe('buildProjectJsonLd', () => {
  it('describes a real project as CreativeWork authored by the Person, with breadcrumbs', () => {
    const graph = buildProjectJsonLd(project, 'en', LABELS)?.['@graph'];
    const [work, crumbs] = graph;
    expect(work['@type']).toBe('CreativeWork');
    expect(work.url).toMatch(/\/en\/projects\/real-project$/);
    expect(work.author['@id']).toMatch(/#person$/);
    expect(work.image).toMatch(/^https?:\/\/.+\/images\/projects\/real-project\/cover\.webp$/);
    expect(work.keywords).toEqual(['Laravel']);
    expect(work.sameAs).toEqual(['https://example.com']);
    // The API's only real date is completion; there is no publish/update date.
    expect(work.dateCreated).toBe('2026-01-10');
    expect(work).not.toHaveProperty('dateModified');
    expect(work.genre).toBe('Enterprise SaaS');
    expect(crumbs.itemListElement.map((item) => item.name)).toEqual([
      'Home',
      'Work',
      'Real Project',
    ]);
  });

  it('uses SoftwareSourceCode when the repository is public', () => {
    const withCode = { ...project, github_url: 'https://github.com/x/y' };
    const graph = buildProjectJsonLd(withCode, 'ar', LABELS)?.['@graph'];
    expect(graph[0]['@type']).toBe('SoftwareSourceCode');
    expect(graph[0].codeRepository).toBe('https://github.com/x/y');
    expect(graph[0].url).not.toContain('/en/');
  });

  it('describes nothing without a project', () => {
    expect(buildProjectJsonLd(undefined, 'en', LABELS)).toBeUndefined();
  });
});
