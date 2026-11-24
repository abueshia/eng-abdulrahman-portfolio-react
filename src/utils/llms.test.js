import { describe, expect, it } from 'vitest';

import { settings } from '@/data/mock/settings';
import { localize } from '@/services/api/mock/response';
import { buildLlmsTxt } from './llms';

const localized = (/** @type {'ar' | 'en'} */ lang) => ({
  settings: localize(settings, lang),
  services: [
    {
      title: 'Payment Gateway Integration',
      description: 'Paymob, Fawry and more.',
      group: { name: 'Backend & Integrations' },
    },
  ],
  faqs: [{ question: 'Do you work remotely?', answer: 'Yes.' }],
  projects: [{ slug: 'sample-x', title: 'Sample', summary: 'Sample project', is_sample: true }],
});

describe('llms.txt', () => {
  const text = buildLlmsTxt({
    siteUrl: 'https://example.vercel.app',
    en: localized('en'),
    ar: localized('ar'),
  });

  it('opens with a factual, quotable definition from the data', () => {
    expect(text.startsWith('# Eng. Abdulrahman Abu Eisha · م. عبدالرحمن أبو عيشة\n')).toBe(true);
    expect(text).toContain(
      '> Abdulrahman Abu Eisha (عبدالرحمن أبو عيشة) is a Full-Stack Software Engineer based in Cairo, Egypt, with 4 years of experience, and Team Lead of iCode Tech.',
    );
    expect(text).toContain('Also written as: عبد الرحمن أبو عيشة');
  });

  it('links the pages, services, FAQ and profiles, never samples or contact numbers', () => {
    expect(text).toContain('[Home, English](https://example.vercel.app/en)');
    expect(text).toContain(
      '- Backend & Integrations: Payment Gateway Integration. Paymob, Fawry and more.',
    );
    expect(text).toContain('- Do you work remotely? Yes.');
    expect(text).toContain('[GitHub](https://github.com/abueshia)');
    expect(text).toContain('[CV (PDF)](https://example.vercel.app/cv/');
    expect(text).not.toContain('sample-x');
    expect(text).not.toContain('wa.me');
    expect(text).not.toMatch(/localhost/);
  });
});
