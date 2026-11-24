import { describe, expect, it } from 'vitest';

import {
  ApiError,
  contactService,
  projectsService,
  settingsService,
  technologiesService,
  testimonialsService,
} from '@/services/api';
import { FIXTURE_SLUG, FIXTURE_SLUG_WITH_REVIEW } from '@/test/api-fixtures';

describe('Axios mock adapter & resource services', () => {
  it('returns localised payloads according to the requested language (ar vs en)', async () => {
    const ar = await settingsService.get({ lang: 'ar' });
    const en = await settingsService.get({ lang: 'en' });

    expect(ar.data.general.owner_name).toBe('عبدالرحمن أبو عيشة');
    expect(en.data.general.owner_name).toBe('Abdulrahman Abu Eisha');
    expect(ar.data.sections_visibility.hero).toBe(true);
  });

  it('pages through the API projects and maps them (real captured responses)', async () => {
    const page1 = await projectsService.list({ page: 1 }, { lang: 'ar' });
    // API pagination (`total_pages`, `total_items`) in the app's shape.
    expect(page1.pagination).toEqual({ current_page: 1, per_page: 9, total: 14, last_page: 2 });
    expect(page1.data).toHaveLength(9);

    const all = await projectsService.all({ lang: 'ar' });
    expect(all.data).toHaveLength(14);
    expect(new Set(all.data.map((p) => p.slug)).size).toBe(14);
    for (const project of all.data) {
      expect(project).not.toHaveProperty('is_sample');
      expect(project.type_label).toBeTruthy();
      expect(Array.isArray(project.technologies)).toBe(true);
    }
  });

  it('returns a full case study with related projects and rejects unknown slugs with 404', async () => {
    const detail = await projectsService.show(FIXTURE_SLUG, { lang: 'en' });
    expect(detail.data?.title).toMatch(/Dr\. KROK/);
    expect(detail.data?.related_projects).toHaveLength(3);
    expect(detail.data?.gallery.length).toBeGreaterThan(3);
    expect(detail.data?.technologies[0]).toHaveProperty('name');

    const withReview = await projectsService.show(FIXTURE_SLUG_WITH_REVIEW, { lang: 'en' });
    expect(withReview.data?.testimonials).toHaveLength(1);

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

  it('validates POST /contact (422), answers a filled honeypot without sending, and returns 201', async () => {
    await expect(
      contactService.send({ name: '', email: 'not-an-email', message: '', type: 'unknown_type' }),
    ).rejects.toSatisfy(
      (err) =>
        err instanceof ApiError &&
        err.isValidation &&
        Boolean(err.errors.name && err.errors.email && err.errors.message && err.errors.type),
    );

    const spam = await contactService.send({
      name: '',
      email: '',
      message: '',
      type: 'general_contact',
      website: 'https://spam.bot',
    });
    expect(spam.code).toBe(201);
    expect(spam.data).toBeNull();

    const valid = await contactService.send({
      name: 'Eng. Reviewer',
      email: 'cto@company.io',
      type: 'project_inquiry',
      service: 'Full web application',
      message: 'We would love to discuss a modular Laravel + React architecture.',
    });
    expect(valid.code).toBe(201);
    expect(valid.data).toHaveProperty('id');
  });

  it('posts a review as multipart under the page language, validates it (422) and never lists it', async () => {
    const before = await testimonialsService.list({ lang: 'en' });

    await expect(
      testimonialsService.submit({
        locale: 'ar',
        name: 'A',
        description: 'short',
        rating: 9,
        project_id: 0,
        consent: true,
        website: '',
        image: new Blob(['gif'], { type: 'image/gif' }),
      }),
    ).rejects.toSatisfy(
      (err) =>
        err instanceof ApiError &&
        err.isValidation &&
        // Translatable keys come back in Laravel's dot notation.
        ['name.ar', 'description.ar', 'rating', 'image'].every((f) => err.errors[f]),
    );

    const created = await testimonialsService.submit({
      locale: 'en',
      name: 'Visitor Reviewer',
      name_job: 'Operations lead',
      company_name: 'Example Co',
      description: 'A calm, well organised project from start to finish.',
      rating: 5,
      consent: true,
      website: '',
      image: new Blob(['webp'], { type: 'image/webp' }),
    });
    expect(created.code).toBe(201);

    const after = await testimonialsService.list({ lang: 'en' });
    expect(after.data).toHaveLength(before.data.length);
    expect(after.data.some((item) => item.name === 'Visitor Reviewer')).toBe(false);
  });
});
