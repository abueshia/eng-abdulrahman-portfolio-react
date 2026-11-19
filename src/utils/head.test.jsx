import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Seo } from '@/components/ui/Seo';
import { renderWithProviders } from '@/test/renderWithProviders';
import { MANAGED_ATTR, applyHead, headToHtml, serializeJson } from './head';

/** @type {import('./head').HeadData} */
const HEAD = {
  title: 'A "quoted" <title>',
  tags: [
    { tag: 'meta', attrs: { name: 'description', content: 'x & y' } },
    { tag: 'script', attrs: { type: 'application/ld+json' }, content: serializeJson({ a: 1 }) },
  ],
};

describe('head utilities', () => {
  it('serialises head data with escaping', () => {
    const html = headToHtml(HEAD);

    expect(html).toContain('<title>A &quot;quoted&quot; &lt;title&gt;</title>');
    expect(html).toContain('<meta name="description" content="x &amp; y" data-seo>');
    expect(html).toContain('<script type="application/ld+json" data-seo>{"a":1}</script>');
  });

  it('escapes "<" in inline JSON so a value cannot close the script tag', () => {
    expect(serializeJson({ html: '</script><script>alert(1)</script>' })).not.toContain(
      '</script>',
    );
  });

  it('replaces only managed tags in the live document', () => {
    const foreign = document.createElement('meta');
    foreign.name = 'theme-color';
    document.head.append(foreign);

    applyHead(HEAD);
    applyHead({
      title: 'Second',
      tags: [{ tag: 'meta', attrs: { name: 'robots', content: 'noindex' } }],
    });

    expect(document.title).toBe('Second');
    expect(document.head.querySelectorAll(`[${MANAGED_ATTR}]`)).toHaveLength(1);
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex',
    );
    expect(document.head.contains(foreign)).toBe(true);
    foreign.remove();
  });
});

describe('<Seo> in the browser', () => {
  it('writes title, canonical and hreflang alternates for the current locale URL', async () => {
    renderWithProviders(
      <>
        <Seo title="Engineering Notes" />
        <span>page</span>
      </>,
      { initialEntries: ['/en/blog'] },
    );
    await screen.findByText('page');

    expect(document.title).toBe('Engineering Notes | Abdulrahman Abu Eisha');
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toMatch(
      /\/en\/blog$/,
    );
    expect(document.head.querySelector('link[hreflang="ar"]')?.getAttribute('href')).toMatch(
      /[^n]\/blog$/,
    );
  });
});
