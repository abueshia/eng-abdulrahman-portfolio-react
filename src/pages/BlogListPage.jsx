import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import '@/i18n/sections';
import { ErrorState } from '@/components/ui/ErrorState';
import { Seo } from '@/components/ui/Seo';
import { BlogIndex } from '@/features/blog/components/BlogIndex';
import { useBlogs } from '@/features/blog/hooks/useBlogs';
import { useHydrated } from '@/hooks/useHydrated';
import { useSectionVisible } from '@/hooks/useSettings';
import { cn } from '@/utils/cn';
import NotFoundPage from './NotFoundPage';

/**
 * Blog index (`/blog`): the editorial index of every note with a category
 * filter kept in the URL (`?category=`, applied after hydration, so the
 * prerendered list is always the full one).
 *
 * SEO: while every post is a sample the page is `noindex` and stays out of
 * the sitemap; the first real post makes it indexable again automatically.
 */
export default function BlogListPage() {
  const visible = useSectionVisible('blog');
  return visible ? <BlogList /> : <NotFoundPage />;
}

function BlogList() {
  const { t } = useTranslation();
  const { data, isPending, isError, refetch } = useBlogs();
  const hydrated = useHydrated();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const posts = useMemo(() => data?.data ?? [], [data]);

  const categories = useMemo(() => {
    const map = new Map();
    posts.forEach((post) => post.category && map.set(post.category.slug, post.category));
    return [...map.values()];
  }, [posts]);
  const requested = hydrated ? params.get('category') : null;
  const category = categories.some((c) => c.slug === requested) ? requested : null;
  const shown = category ? posts.filter((post) => post.category?.slug === category) : posts;
  const allSamples = !posts.some((post) => !post.is_sample);

  const choose = (/** @type {string | null} */ slug) => {
    const next = new URLSearchParams(params);
    if (slug) next.set('category', slug);
    else next.delete('category');
    const search = next.toString();
    navigate(
      { search: search ? `?${search}` : '' },
      { replace: true, preventScrollReset: true, state: location.state },
    );
  };

  return (
    <div className="blog-page container-fluid">
      <Seo title={t('meta.blogTitle')} description={t('blog.subtitle')} noIndex={allSamples} />
      <header className="blog-page__head">
        <p className="blog-page__eyebrow" dir="ltr">
          {t('blog.changelog')} · {t('blog.count', { count: posts.length })}
        </p>
        <h1 id="blog-title" className="blog-page__title">
          {t('blog.title')}
        </h1>
        <p className="blog-page__lead">{t('blog.subtitle')}</p>
      </header>

      {categories.length > 1 && (
        <div className="blog-page__filter" role="group" aria-label={t('blog.filter')}>
          {[{ slug: null, name: t('blog.allCategories') }, ...categories].map((item) => {
            const pressed = category === item.slug;
            return (
              <button
                key={item.slug ?? '*'}
                type="button"
                className={cn('query__chip', pressed && 'is-active is-flat')}
                aria-pressed={pressed}
                onClick={() => choose(pressed ? null : item.slug)}
              >
                <span className="query__chip-label">{item.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {isPending && <p className="font-mono text-sm text-ink-dim">{t('common.loading')}</p>}
      {isError && <ErrorState onRetry={refetch} />}
      {shown.length > 0 && <BlogIndex posts={shown} headingLevel="h2" />}
      {data && shown.length === 0 && (
        <p className="blog-page__empty" role="status">
          {t('blog.empty')}
        </p>
      )}
    </div>
  );
}
