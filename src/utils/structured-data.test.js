import { describe, expect, it } from 'vitest';

import { buildProjectJsonLd } from './structured-data';

const LABELS = { home: 'Home', work: 'Work' };
const project = {
  slug: 'real-project',
  is_sample: false,
  title: 'Real Project',
  summary: 'What it is.',
  cover_image: '/images/projects/real-project/cover.webp',
  published_at: '2026-01-10',
  updated_at: '2026-02-01',
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

  it('never describes a sample as real work', () => {
    expect(buildProjectJsonLd({ ...project, is_sample: true }, 'en', LABELS)).toBeUndefined();
    expect(buildProjectJsonLd(undefined, 'en', LABELS)).toBeUndefined();
  });
});
