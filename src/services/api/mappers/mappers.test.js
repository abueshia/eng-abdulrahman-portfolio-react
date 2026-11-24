import { describe, expect, it } from 'vitest';

import contact422Ar from '../../../../docs/api-fixtures/contact.store.422-invalid.ar.json';
import experiencesAr from '../../../../docs/api-fixtures/experiences.index.ar.json';
import experiencesEn from '../../../../docs/api-fixtures/experiences.index.en.json';
import faqsAr from '../../../../docs/api-fixtures/faqs.index.ar.json';
import faqsEn from '../../../../docs/api-fixtures/faqs.index.en.json';
import projectsEn from '../../../../docs/api-fixtures/projects.index.per_page50.en.json';
import showEn from '../../../../docs/api-fixtures/projects.show.en.json';
import smallEn from '../../../../docs/api-fixtures/projects.show.small-gallery.en.json';
import testimonialsAr from '../../../../docs/api-fixtures/testimonials.index.ar.json';
import testimonialsEn from '../../../../docs/api-fixtures/testimonials.index.en.json';
import review422Ar from '../../../../docs/api-fixtures/testimonials.store.422-invalid.ar.json';
import { contactFieldFor } from '@/features/contact/lib/schema';
import { reviewFieldFor } from '@/features/testimonials/lib/review-schema';
import { toApiError } from '../errors';
import { retryAfterSeconds } from '../rate-limit';
import { mapExperience, mapExperiences } from './experiences';
import { mapFaqs } from './faqs';
import { mapProject, mapProjects } from './projects';
import { lines, mapPagination, text } from './shared';
import { mapTestimonial, mapTestimonials } from './testimonials';

describe('shared normalisers', () => {
  it('splits list text: arrays or lines, trimmed, bullet markers removed, blanks dropped', () => {
    expect(lines('  - one\r\n\r\n• two \n3. three\n*   four\n')).toEqual([
      'one',
      'two',
      'three',
      'four',
    ]);
    expect(lines(['- a', ' b\nc ', '', null])).toEqual(['a', 'b', 'c']);
    expect(lines('')).toEqual([]);
    expect(lines(null)).toEqual([]);
    // A hyphen inside a word is not a marker.
    expect(lines('Full-stack delivery')).toEqual(['Full-stack delivery']);
  });

  it('drops editor citation artefacts and normalises line breaks', () => {
    expect(text('Done [cite: 54, 56, 60].\r\nNext')).toBe('Done.\nNext');
    expect(text(null)).toBe('');
  });

  it("maps the API pagination block (total_pages, total_items) to the app's shape", () => {
    expect(mapPagination(projectsEn.pagination)).toEqual({
      current_page: 1,
      per_page: 50,
      total: 14,
      last_page: 1,
    });
    expect(mapPagination(undefined)).toBeUndefined();
  });
});

describe('experiences mapper (real fixtures)', () => {
  it('maps every record in both languages with clean achievement items', () => {
    for (const fixture of [experiencesAr, experiencesEn]) {
      const items = mapExperiences(fixture.data);
      expect(items).toHaveLength(fixture.data.length);
      for (const item of items) {
        expect(item.company).toBeTruthy();
        expect(item.role).toBeTruthy();
        expect(item.employment_label).toBeTruthy();
        expect(item.achievements.length).toBeGreaterThan(0);
        for (const line of item.achievements) {
          expect(line).toBe(line.trim());
          expect(line).not.toMatch(/^[-*•]\s/);
          expect(line).not.toContain('\n');
        }
      }
    }
  });

  it('keeps current roles open-ended and splits the achievements string on new lines', () => {
    const items = mapExperiences(experiencesEn.data);
    const current = items.filter((item) => item.is_current);
    expect(current.map((item) => item.id)).toEqual([9, 10]);
    expect(current.every((item) => item.end_date === null)).toBe(true);
    const raw = experiencesEn.data[0];
    expect(mapExperience(raw)?.achievements).toHaveLength(
      raw.achievements.split('\n').filter((line) => line.trim()).length,
    );
  });

  it('accepts achievements as an array and falls back to highlights', () => {
    const base = experiencesEn.data[0];
    expect(
      mapExperience({ ...base, achievements: ['- First', '  Second  '] })?.achievements,
    ).toEqual(['First', 'Second']);
    expect(
      mapExperience({ ...base, achievements: undefined, highlights: '• Only\n' })?.achievements,
    ).toEqual(['Only']);
  });

  it('drops records without the fields the timeline needs', () => {
    expect(
      mapExperience({ id: 1, company_name: '', role_title: 'x', start_date: '2024-01-01' }),
    ).toBeNull();
    expect(mapExperiences(null)).toEqual([]);
  });
});

describe('projects mapper (real fixtures)', () => {
  it('maps every list item with labels, technologies and dates', () => {
    const projects = mapProjects(projectsEn.data);
    expect(projects).toHaveLength(14);
    for (const project of projects) {
      expect(project.slug).toBeTruthy();
      expect(project.type_label).toBeTruthy();
      expect(project.summary).toBeTruthy();
      expect(project.related_projects).toEqual([]);
      expect(project.testimonials).toEqual([]);
      if (project.completed_at) expect(project.year).toBe(Number(project.completed_at.slice(0, 4)));
    }
  });

  it('maps a detail: challenges, paragraphs, gallery with alt text, related projects', () => {
    const project = mapProject(showEn.data);
    expect(project).not.toBeNull();
    if (!project) return;
    expect(project.challenges).toHaveLength(showEn.data.challenge.length);
    expect(project.challenges[0]).toEqual({
      title: showEn.data.challenge[0].title,
      body: showEn.data.challenge[0].description,
    });
    expect(project.solution.join(' ')).not.toMatch(/\[cite:/);
    expect(project.gallery).toHaveLength(showEn.data.gallery.length);
    expect(project.gallery[0]).toEqual({
      image: showEn.data.gallery[0],
      alt: `${project.title} (1/${showEn.data.gallery.length})`,
    });
    expect(project.preview_image).toBe(showEn.data.gallery[0]);
    expect(project.related_projects.map((p) => p.slug)).toEqual(
      showEn.data.related_projects.map((/** @type {any} */ p) => p.slug),
    );
    expect(project.github_url).toBeNull();
    expect(project.live_url).toBe(showEn.data.live_url);
    expect(project.role).toBeNull(); // "" in the API
    expect(project.metrics).toEqual([]);
  });

  it('maps the testimonials linked to a project', () => {
    const project = mapProject(smallEn.data);
    expect(project?.testimonials).toHaveLength(1);
    // Nested reviews carry no `project` key in the real response.
    expect(project?.testimonials[0]).toMatchObject({ name: 'Tarek Abdelaziz', project: null });
  });

  it('tolerates null metrics, a plain-string challenge and a missing cover', () => {
    const project = mapProject({
      ...showEn.data,
      metrics: null,
      challenge: 'Legacy text',
      cover_image: null,
      gallery: [],
      completed_at: null,
    });
    expect(project?.metrics).toEqual([]);
    expect(project?.challenges).toEqual([{ title: '', body: 'Legacy text' }]);
    expect(project?.cover_image).toBeNull();
    expect(project?.preview_image).toBeNull();
    expect(project?.year).toBeNull();
  });
});

describe('testimonials mapper (real fixtures)', () => {
  it('maps approved reviews with rating, featured flag, linked project and no photo', () => {
    for (const fixture of [testimonialsAr, testimonialsEn]) {
      const items = mapTestimonials(fixture.data);
      expect(items).toHaveLength(fixture.data.length);
      for (const item of items) {
        expect(item.name).toBeTruthy();
        expect(item.quote).toBeTruthy();
        expect(item.rating).toBeGreaterThanOrEqual(1);
        // `avatar` is null today: the card falls back to the generated monogram.
        expect(item.avatar).toBeNull();
      }
    }
    const en = mapTestimonials(testimonialsEn.data);
    expect(en.filter((item) => item.is_featured).length).toBeGreaterThan(0);
    expect(en.find((item) => item.project)?.project).toEqual({
      id: 11,
      title: expect.any(String),
      slug: 'high-throughput-ecommerce-api',
    });
  });

  it('reads the alias fields and rejects records without name or text', () => {
    expect(
      mapTestimonial({
        id: 1,
        client_name: 'A',
        testimonial: 'Text',
        client_role: 'CTO',
        rating: 9,
      }),
    ).toMatchObject({ name: 'A', quote: 'Text', role: 'CTO', rating: 0, project: null });
    expect(mapTestimonial({ id: 2, name: 'A', description: '' })).toBeNull();
    expect(
      mapTestimonial({ id: 3, name: 'A', description: 'x', avatar: 'javascript:alert(1)' })?.avatar,
    ).toBeNull();
  });
});

describe('faqs mapper (real fixtures)', () => {
  it('maps every question and answer in both languages', () => {
    for (const fixture of [faqsAr, faqsEn]) {
      const faqs = mapFaqs(fixture.data);
      expect(faqs).toHaveLength(fixture.data.length);
      expect(faqs.every((faq) => faq.question && faq.answer)).toBe(true);
    }
  });
});

describe('422 keys → form fields (real fixtures)', () => {
  it('places contact errors on their fields and ignores the honeypot', () => {
    const fields = Object.keys(contact422Ar.errors).map(contactFieldFor);
    expect(fields).toEqual(['name', 'email', 'message', 'type', null]);
  });

  it('places review errors on their fields, translatable keys included', () => {
    expect(Object.keys(review422Ar.errors).map(reviewFieldFor)).toEqual([
      'rating',
      'project_id',
      null,
      'name',
      'description',
    ]);
    expect(reviewFieldFor('name.ar')).toBe('name');
    expect(reviewFieldFor('description.en')).toBe('description');
    expect(reviewFieldFor('testimonial')).toBe('description');
    expect(reviewFieldFor('avatar')).toBe('image');
  });

  it('reads Retry-After from a 429', () => {
    const error = toApiError({
      response: {
        status: 429,
        data: { message: 'Too Many Attempts.' },
        headers: { 'retry-after': '3600' },
      },
    });
    expect(error.isRateLimited).toBe(true);
    expect(retryAfterSeconds(error)).toBe(3600);
    expect(retryAfterSeconds(toApiError({ response: { status: 429, headers: {} } }))).toBeNull();
  });
});
