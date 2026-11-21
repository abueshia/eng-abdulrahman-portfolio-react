import { describe, expect, it } from 'vitest';

import {
  ApiError,
  contactService,
  projectsService,
  settingsService,
  technologiesService,
  testimonialsService,
} from '@/services/api';

describe('Axios mock adapter & resource services', () => {
  it('returns localised payloads according to the requested language (ar vs en)', async () => {
    const ar = await settingsService.get({ lang: 'ar' });
    const en = await settingsService.get({ lang: 'en' });

    expect(ar.data.general.owner_name).toBe('عبدالرحمن أبو عيشة');
    expect(en.data.general.owner_name).toBe('Abdulrahman Abu Eisha');
    expect(ar.data.sections_visibility.hero).toBe(true);
  });

  it('filters and paginates projects by type, technology and featured flag', async () => {
    const all = await projectsService.list({}, { lang: 'en' });
    expect(all.data).toHaveLength(3);
    // Sample records say so: the UI badges them and keeps them out of the index.
    expect(all.data.every((p) => p.is_sample === true)).toBe(true);
    expect(all.pagination).toMatchObject({
      current_page: 1,
      total: all.data.length,
    });

    const apis = await projectsService.list({ type: 'api' }, { lang: 'en' });
    expect(apis.data.length).toBeGreaterThan(0);
    expect(apis.data.every((p) => p.type === 'api')).toBe(true);

    const redisProjects = await projectsService.list({ technology: 'redis' }, { lang: 'en' });
    expect(redisProjects.data.length).toBeGreaterThan(0);
    expect(
      redisProjects.data.every((p) => p.technologies.some((tech) => tech.slug === 'redis')),
    ).toBe(true);

    const page1 = await projectsService.list({ per_page: 2, page: 1 }, { lang: 'en' });
    expect(page1.data).toHaveLength(2);
    expect(page1.pagination?.per_page).toBe(2);
    expect(page1.pagination?.last_page).toBe(2);
  });

  it('returns a full case study with related_projects and rejects unknown slugs with 404', async () => {
    const detail = await projectsService.show('sample-saas-billing', { lang: 'en' });
    expect(detail.data.title).toBe('Multi-tenant SaaS Subscription Platform');
    expect(detail.data.architecture.nodes.length).toBeGreaterThan(0);
    expect(detail.data.metrics.some((metric) => metric.value === null)).toBe(true);
    expect(detail.data.related_projects.length).toBeGreaterThan(0);
    expect(detail.data.technologies[0]).toHaveProperty('name');

    await expect(projectsService.show('non-existent-slug')).rejects.toSatisfy(
      (err) => err instanceof ApiError && err.isNotFound,
    );
  });

  it('returns technologies grouped by category in sorted order', async () => {
    const res = await technologiesService.list({ lang: 'en' });
    const categories = res.data.map((group) => group.category);

    expect(categories).toEqual(['backend', 'frontend', 'database', 'devops', 'architecture']);
    expect(res.data[0].technologies.some((t) => t.slug === 'laravel')).toBe(true);
  });

  it('validates POST /contact (422), handles honeypot, and returns 201 on valid input', async () => {
    await expect(
      contactService.send({ name: '', email: 'not-an-email', message: 'short' }),
    ).rejects.toSatisfy(
      (err) =>
        err instanceof ApiError &&
        err.isValidation &&
        Boolean(err.errors.name && err.errors.email && err.errors.message),
    );

    const spam = await contactService.send({
      name: '',
      email: '',
      message: '',
      website: 'https://spam.bot',
    });
    expect(spam.code).toBe(201);
    expect(spam.data).toBeNull();

    const valid = await contactService.send({
      name: 'Eng. Reviewer',
      email: 'cto@company.io',
      type: 'web_app',
      message: 'We would love to discuss a modular Laravel + React architecture.',
    });
    expect(valid.code).toBe(201);
    expect(valid.data).toHaveProperty('id');
  });

  it('accepts POST /testimonials as multipart, validates it (422) and never publishes it', async () => {
    const before = await testimonialsService.list({ lang: 'en' });
    expect(before.data.every((item) => item.status === 'approved')).toBe(true);

    await expect(
      testimonialsService.submit({
        name: 'A',
        role: '',
        rating: 9,
        message: 'short <b>x</b>',
        consent: false,
        hp: '',
        avatar: new Blob(['gif'], { type: 'image/gif' }),
      }),
    ).rejects.toSatisfy(
      (err) =>
        err instanceof ApiError &&
        err.isValidation &&
        ['name', 'role', 'rating', 'message', 'consent', 'avatar'].every((f) => err.errors[f]),
    );

    const created = await testimonialsService.submit({
      name: 'Visitor Reviewer',
      role: 'Operations lead',
      company: 'Sample Co',
      rating: 5,
      message: 'A calm, well organised project from start to finish.',
      consent: true,
      hp: '',
      avatar: new Blob(['webp'], { type: 'image/webp' }),
    });
    expect(created.code).toBe(201);
    expect(created.data).toMatchObject({ status: 'pending' });

    const after = await testimonialsService.list({ lang: 'en' });
    expect(after.data).toHaveLength(before.data.length);
    expect(after.data.some((item) => item.name === 'Visitor Reviewer')).toBe(false);
  });
});
