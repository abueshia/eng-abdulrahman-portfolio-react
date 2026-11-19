import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { ErrorState } from '@/components/ui/ErrorState';
import { Seo } from '@/components/ui/Seo';
import { useBlog } from '@/features/blog/hooks/useBlogs';
import NotFoundPage from './NotFoundPage';

/**
 * Article page (foundation version: data wiring + title).
 * Sanitised HTML rendering, Shiki highlighting and TOC land in phase 5.
 */
export default function BlogDetailsPage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { data, isPending, isError, error, refetch } = useBlog(slug);

  if (isError && error?.isNotFound) return <NotFoundPage />;
  const post = data?.data;

  return (
    <article className="container-fluid flex max-w-4xl flex-col gap-6 pt-[calc(var(--nav-height)+4rem)] pb-24">
      <Seo
        title={post?.title}
        description={post?.excerpt}
        image={post?.cover_image}
        type="article"
      />
      {isPending && <p className="font-mono text-sm text-ink-dim">{t('common.loading')}</p>}
      {isError && <ErrorState onRetry={refetch} />}
      {post && (
        <>
          <p className="font-mono text-xs text-ink-dim">
            {post.category?.name} · {t('common.minRead', { count: post.reading_time })}
          </p>
          <h1 className="font-display text-display-md font-bold tracking-tight text-balance">
            {post.title}
          </h1>
          <p className="text-xl text-ink-muted">{post.excerpt}</p>
        </>
      )}
    </article>
  );
}
