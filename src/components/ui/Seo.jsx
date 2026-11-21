import { useContext, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { env } from '@/config/env';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, localizePath, stripLocale } from '@/config/routes';
import { HeadContext } from '@/context/head-context';
import { useLocale } from '@/hooks/useLocale';
import { applyHead, serializeJson } from '@/utils/head';

const OG_LOCALES = { ar: 'ar_AR', en: 'en_US' };

/**
 * Per-page document metadata: title, description, canonical URL, hreflang
 * alternates, robots, Open Graph / Twitter tags and JSON-LD.
 *
 * Render exactly one `<Seo>` per page. While prerendering, the tags are handed
 * to the head collector and written into the static HTML; in the browser they
 * are applied after mount and whenever the inputs change.
 *
 * @param {Object} props
 * @param {string} [props.title]        Page title (wrapped by the locale title template).
 * @param {string} [props.fullTitle]    Complete title used as is (home page, from settings.seo.meta_title).
 * @param {string} [props.description]
 * @param {string} [props.image]        Absolute or root-relative OG image.
 * @param {'website' | 'article' | 'profile'} [props.type='website']
 * @param {boolean} [props.noIndex=false] Keep the page out of the index (links are still followed).
 * @param {number} [props.status=200]  HTTP status the prerenderer serves the page with (404 page: 404, also `nofollow`).
 * @param {object | object[]} [props.jsonLd] Schema.org structured data.
 */
export function Seo({
  title,
  fullTitle,
  description,
  image,
  type = 'website',
  noIndex = false,
  status = 200,
  jsonLd,
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { pathname } = useLocation();
  const collector = useContext(HeadContext);

  const basePath = stripLocale(pathname);
  // `%s` is replaced manually: i18next interpolation uses {{ }} placeholders.
  const resolvedTitle =
    fullTitle || (title ? t('meta.titleTemplate').replace('%s', title) : t('meta.defaultTitle'));
  const desc = description || t('meta.defaultDescription');
  const siteName = t('meta.siteName');

  const head = useMemo(() => {
    const absolute = (/** @type {string} */ path) => `${env.siteUrl}${path}`;
    const canonical = absolute(localizePath(locale, basePath));
    const ogImage = new URL(image || '/images/og-cover.jpg', `${env.siteUrl}/`).href;
    const meta = (/** @type {Record<string, string>} */ attrs) => ({ tag: 'meta', attrs });
    const link = (/** @type {Record<string, string>} */ attrs) => ({ tag: 'link', attrs });
    const structured = jsonLd ? [jsonLd].flat() : [];

    const robots = !noIndex
      ? 'index, follow, max-image-preview:large'
      : status === 404
        ? 'noindex, nofollow'
        : 'noindex, follow';

    return {
      title: resolvedTitle,
      status,
      tags: /** @type {import('@/utils/head').HeadTag[]} */ ([
        meta({ name: 'description', content: desc }),
        meta({ name: 'robots', content: robots }),
        link({ rel: 'canonical', href: canonical }),
        ...SUPPORTED_LOCALES.map((lng) =>
          link({ rel: 'alternate', hreflang: lng, href: absolute(localizePath(lng, basePath)) }),
        ),
        link({
          rel: 'alternate',
          hreflang: 'x-default',
          href: absolute(localizePath(DEFAULT_LOCALE, basePath)),
        }),
        meta({ property: 'og:type', content: type }),
        meta({ property: 'og:site_name', content: siteName }),
        meta({ property: 'og:title', content: resolvedTitle }),
        meta({ property: 'og:description', content: desc }),
        meta({ property: 'og:url', content: canonical }),
        meta({ property: 'og:image', content: ogImage }),
        meta({ property: 'og:locale', content: OG_LOCALES[locale] }),
        ...SUPPORTED_LOCALES.filter((lng) => lng !== locale).map((lng) =>
          meta({ property: 'og:locale:alternate', content: OG_LOCALES[lng] }),
        ),
        meta({ name: 'twitter:card', content: 'summary_large_image' }),
        meta({ name: 'twitter:title', content: resolvedTitle }),
        meta({ name: 'twitter:description', content: desc }),
        meta({ name: 'twitter:image', content: ogImage }),
        ...structured.map((data) => ({
          tag: 'script',
          attrs: { type: 'application/ld+json' },
          content: serializeJson(data),
        })),
      ]),
    };
  }, [locale, basePath, image, jsonLd, resolvedTitle, desc, siteName, type, noIndex, status]);

  // Server: hand the tags to the prerenderer (effects never run there).
  collector?.collect(head);

  // Browser: keep the live <head> in sync.
  useEffect(() => {
    applyHead(head);
  }, [head]);

  return null;
}
