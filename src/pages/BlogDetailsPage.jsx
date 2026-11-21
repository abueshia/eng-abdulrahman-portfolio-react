import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import '@/i18n/work';
import { ErrorState } from '@/components/ui/ErrorState';
import { Seo } from '@/components/ui/Seo';
import { Article } from '@/features/blog/components/Article';
import { useBlog } from '@/features/blog/hooks/useBlogs';
import { useLocale } from '@/hooks/useLocale';
import { useSectionVisible } from '@/hooks/useSettings';
import { buildArticleJsonLd } from '@/utils/structured-data';
import NotFoundPage from './NotFoundPage';

/** Open Graph needs a raster image; SVG covers fall back to the default one. */
const isRaster = (/** @type {string | undefined} */ src) =>
  Boolean(src && /\.(jpe?g|png|webp)(\?.*)?$/i.test(src));

/**
 * Article page (`/blog/:slug`). The HTML arrives processed (sanitised,
 * highlighted, with heading ids) from the query. Sample posts are `noindex`,
 * stay out of the sitemap and get no BlogPosting JSON-LD.
 */
export default function BlogDetailsPage() {
  // A hidden blog (settings.sections_visibility.blog) has no public pages.
  const visible = useSectionVisible('blog');
  return visible ? <BlogPost /> : <NotFoundPage />;
}

function BlogPost() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { data, isPending, isError, error, refetch } = useBlog(slug);
  const post = data?.data;
  const home = t('caseStudy.home');
  const blog = t('nav.blog');
  const jsonLd = useMemo(
    () => buildArticleJsonLd(post, locale, { home, blog }),
    [post, locale, home, blog],
  );

  if (isError && error?.isNotFound) return <NotFoundPage />;

  return (
    <>
      <Seo
        title={post?.title}
        description={post?.excerpt}
        image={isRaster(post?.cover_image) ? post.cover_image : undefined}
        type="article"
        noIndex={Boolean(post?.is_sample)}
        jsonLd={jsonLd}
      />
      {isPending && (
        <p className="container-fluid pt-[calc(var(--nav-height)+4rem)] font-mono text-sm text-ink-dim">
          {t('common.loading')}
        </p>
      )}
      {isError && (
        <div className="container-fluid pt-[calc(var(--nav-height)+4rem)]">
          <ErrorState onRetry={refetch} />
        </div>
      )}
      {post && <Article post={post} />}
    </>
  );
}
