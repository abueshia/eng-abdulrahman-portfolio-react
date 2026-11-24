import { describe, expect, it } from 'vitest';

import { EMPTY_REVIEW, reviewFingerprint, reviewSchema, toReviewPayload } from './review-schema';
import { reviewRelayMessage } from './review-relay';

const VALID = {
  ...EMPTY_REVIEW,
  name: 'Example Reviewer',
  name_job: 'Product manager',
  company_name: '',
  rating: '4',
  description: 'Clear communication and a well documented API.',
  consent: true,
};

/** @param {Record<string, unknown>} values */
const errorsOf = (values) => {
  const result = reviewSchema.safeParse({ ...VALID, ...values });
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]));
};

describe('review schema (POST /testimonials fields)', () => {
  it('accepts a complete review and coerces the rating', () => {
    const result = reviewSchema.safeParse(VALID);
    expect(result.success).toBe(true);
    expect(result.data?.rating).toBe(4);
  });

  it('validates the name (required, 2-80, plain text)', () => {
    expect(errorsOf({ name: '' }).name).toBe('testimonials.write.errors.nameMin');
    expect(errorsOf({ name: ' A ' }).name).toBe('testimonials.write.errors.nameMin');
    expect(errorsOf({ name: 'x'.repeat(81) }).name).toBe('testimonials.write.errors.nameMax');
    expect(errorsOf({ name: 'x'.repeat(80) }).name).toBeUndefined();
    expect(errorsOf({ name: '<b>Bold</b>' }).name).toBe('testimonials.write.errors.html');
  });

  it('keeps the job title and company optional (≤ 100, plain text)', () => {
    expect(errorsOf({ name_job: '' }).name_job).toBeUndefined();
    expect(errorsOf({ name_job: 'x'.repeat(101) }).name_job).toBe(
      'testimonials.write.errors.roleMax',
    );
    expect(errorsOf({ name_job: '<script>x</script>' }).name_job).toBe(
      'testimonials.write.errors.html',
    );
    expect(errorsOf({ company_name: '' }).company_name).toBeUndefined();
    expect(errorsOf({ company_name: 'x'.repeat(101) }).company_name).toBe(
      'testimonials.write.errors.companyMax',
    );
  });

  it('requires a 1-5 star rating', () => {
    for (const rating of ['', null, '0', '6', '2.5']) {
      expect(errorsOf({ rating }).rating).toBe('testimonials.write.errors.ratingRequired');
    }
    for (const rating of ['1', '5', 3]) expect(errorsOf({ rating }).rating).toBeUndefined();
  });

  it('validates the review text (10-1000, plain text) and the consent', () => {
    expect(errorsOf({ description: 'too short' }).description).toBe(
      'testimonials.write.errors.messageMin',
    );
    expect(errorsOf({ description: 'x'.repeat(1001) }).description).toBe(
      'testimonials.write.errors.messageMax',
    );
    expect(errorsOf({ description: 'Great work <img src=x onerror=alert(1)>' }).description).toBe(
      'testimonials.write.errors.html',
    );
    expect(errorsOf({ consent: false }).consent).toBe('testimonials.write.errors.consentRequired');
  });

  it('builds a trimmed payload in the page language, omits empty optionals and fingerprints it', () => {
    const payload = toReviewPayload(
      { ...VALID, name: '  Example Reviewer ', company_name: ' ', project_id: '11' },
      'ar',
    );
    expect(payload).toEqual({
      locale: 'ar',
      name: 'Example Reviewer',
      name_job: 'Product manager',
      description: 'Clear communication and a well documented API.',
      rating: 4,
      project_id: 11,
      consent: true,
      website: '',
    });
    expect(toReviewPayload(VALID, 'en')).not.toHaveProperty('project_id');
    const withPhoto = toReviewPayload(VALID, 'en', new Blob(['x'], { type: 'image/webp' }));
    expect(withPhoto.image).toBeInstanceOf(Blob);
    expect(reviewFingerprint(toReviewPayload(VALID, 'en'))).toBe(
      reviewFingerprint(toReviewPayload(VALID, 'ar')),
    );
    expect(reviewFingerprint(toReviewPayload(VALID, 'en'))).not.toBe(reviewFingerprint(withPhoto));
  });

  it('formats the relay message with the name, title, stars and text (no photo)', () => {
    const text = reviewRelayMessage(
      toReviewPayload({ ...VALID, company_name: 'Example Co' }, 'en'),
      {
        greeting: "Hello, I'm Example Reviewer.",
        role: 'Job title',
        rating: 'Rating 4/5:',
      },
    );
    expect(text).toBe(
      [
        "Hello, I'm Example Reviewer.",
        'Job title: Product manager · Example Co',
        'Rating 4/5: ★★★★☆',
        '',
        'Clear communication and a well documented API.',
      ].join('\n'),
    );
  });
});
