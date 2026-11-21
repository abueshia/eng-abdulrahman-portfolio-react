import { describe, expect, it } from 'vitest';

import { EMPTY_REVIEW, reviewFingerprint, reviewSchema, toReviewPayload } from './review-schema';
import { reviewRelayMessage } from './review-relay';

const VALID = {
  ...EMPTY_REVIEW,
  name: 'Sample Reviewer',
  role: 'Product manager',
  company: '',
  rating: '4',
  message: 'Clear communication and a well documented API.',
  consent: true,
};

/** @param {Record<string, unknown>} values */
const errorsOf = (values) => {
  const result = reviewSchema.safeParse({ ...VALID, ...values });
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]));
};

describe('review schema', () => {
  it('accepts a complete review and coerces the rating', () => {
    const result = reviewSchema.safeParse(VALID);
    expect(result.success).toBe(true);
    expect(result.data?.rating).toBe(4);
  });

  it('validates the name (required, 2-60, plain text)', () => {
    expect(errorsOf({ name: '' }).name).toBe('testimonials.write.errors.nameMin');
    expect(errorsOf({ name: ' A ' }).name).toBe('testimonials.write.errors.nameMin');
    expect(errorsOf({ name: 'x'.repeat(61) }).name).toBe('testimonials.write.errors.nameMax');
    expect(errorsOf({ name: 'x'.repeat(60) }).name).toBeUndefined();
    expect(errorsOf({ name: '<b>Bold</b>' }).name).toBe('testimonials.write.errors.html');
  });

  it('validates the job title (required, 2-80) and the optional company (≤ 80)', () => {
    expect(errorsOf({ role: '' }).role).toBe('testimonials.write.errors.roleMin');
    expect(errorsOf({ role: 'x'.repeat(81) }).role).toBe('testimonials.write.errors.roleMax');
    expect(errorsOf({ role: '<script>x</script>' }).role).toBe('testimonials.write.errors.html');
    expect(errorsOf({ company: '' }).company).toBeUndefined();
    expect(errorsOf({ company: 'x'.repeat(81) }).company).toBe(
      'testimonials.write.errors.companyMax',
    );
    expect(errorsOf({ company: '<i>Co</i>' }).company).toBe('testimonials.write.errors.html');
  });

  it('requires a 1-5 star rating', () => {
    for (const rating of ['', null, '0', '6', '2.5']) {
      expect(errorsOf({ rating }).rating).toBe('testimonials.write.errors.ratingRequired');
    }
    for (const rating of ['1', '5', 3]) expect(errorsOf({ rating }).rating).toBeUndefined();
  });

  it('validates the review text (20-600, plain text) and the consent', () => {
    expect(errorsOf({ message: 'too short' }).message).toBe('testimonials.write.errors.messageMin');
    expect(errorsOf({ message: 'x'.repeat(601) }).message).toBe(
      'testimonials.write.errors.messageMax',
    );
    expect(errorsOf({ message: 'Great work <img src=x onerror=alert(1)>' }).message).toBe(
      'testimonials.write.errors.html',
    );
    expect(errorsOf({ consent: false }).consent).toBe('testimonials.write.errors.consentRequired');
  });

  it('builds a trimmed payload, omits empty optionals and fingerprints it', () => {
    const payload = toReviewPayload({ ...VALID, name: '  Sample Reviewer ', company: ' ' });
    expect(payload).toEqual({
      name: 'Sample Reviewer',
      role: 'Product manager',
      rating: 4,
      message: 'Clear communication and a well documented API.',
      consent: true,
      hp: '',
    });
    const withPhoto = toReviewPayload(VALID, new Blob(['x'], { type: 'image/webp' }));
    expect(withPhoto.avatar).toBeInstanceOf(Blob);
    expect(reviewFingerprint(payload)).toBe(reviewFingerprint(toReviewPayload(VALID)));
    expect(reviewFingerprint(payload)).not.toBe(reviewFingerprint(withPhoto));
  });

  it('formats the relay message with the name, title, stars and text (no photo)', () => {
    const text = reviewRelayMessage(toReviewPayload({ ...VALID, company: 'Sample Co' }), {
      greeting: "Hello, I'm Sample Reviewer.",
      role: 'Job title',
      rating: 'Rating 4/5:',
    });
    expect(text).toBe(
      [
        "Hello, I'm Sample Reviewer.",
        'Job title: Product manager · Sample Co',
        'Rating 4/5: ★★★★☆',
        '',
        'Clear communication and a well documented API.',
      ].join('\n'),
    );
  });
});
