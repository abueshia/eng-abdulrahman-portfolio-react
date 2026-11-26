import { afterEach, describe, expect, it, vi } from 'vitest';

import { HOME_PROJECTS, projectsService } from './projects.service';

const project = (/** @type {string} */ slug) => /** @type {any} */ ({ slug });
const page = (/** @type {string[]} */ slugs) => ({
  data: slugs.map(project),
  pagination: { current_page: 1, per_page: HOME_PROJECTS, total: 14, last_page: 5 },
});

describe('projectsService.featured (home case files)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('asks the API for the featured three and stops there when it has them', async () => {
    const list = vi.spyOn(projectsService, 'list').mockResolvedValue(page(['a', 'b', 'c']));

    const result = await projectsService.featured({ lang: 'en' });

    expect(result.data.map((p) => p.slug)).toEqual(['a', 'b', 'c']);
    expect(list).toHaveBeenCalledTimes(1);
    expect(list).toHaveBeenCalledWith({ featured: 1, per_page: 3 }, { lang: 'en' });
  });

  it('tops up from the latest without duplicates when fewer are featured', async () => {
    const list = vi
      .spyOn(projectsService, 'list')
      .mockResolvedValueOnce(page(['b']))
      .mockResolvedValueOnce(page(['a', 'b', 'c']));

    const result = await projectsService.featured({ lang: 'ar' });

    expect(result.data.map((p) => p.slug)).toEqual(['b', 'a', 'c']);
    expect(list).toHaveBeenLastCalledWith({ per_page: 3 }, { lang: 'ar' });
  });

  it('falls back entirely to the latest when nothing is featured (today)', async () => {
    vi.spyOn(projectsService, 'list')
      .mockResolvedValueOnce(page([]))
      .mockResolvedValueOnce(page(['x', 'y']));

    const result = await projectsService.featured();

    expect(result.data.map((p) => p.slug)).toEqual(['x', 'y']);
  });
});
