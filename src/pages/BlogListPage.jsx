import { useTranslation } from 'react-i18next';

import { ErrorState } from '@/components/ui/ErrorState';
import { LocalizedLink } from '@/components/ui/LocalizedLink';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Seo } from '@/components/ui/Seo';
import { paths } from '@/config/routes';
import { useBlogs } from '@/features/blog/hooks/useBlogs';

/** Blog index (foundation version; the editorial index lands in phase 5). */
export default function BlogListPage() {
  const { t } = useTranslation();
  const { data, isPending, isError, refetch } = useBlogs();

  return (
    <div className="container-fluid flex flex-col gap-14 pt-[calc(var(--nav-height)+4rem)] pb-24">
      <Seo title={t('meta.blogTitle')} description={t('blog.subtitle')} />
      <SectionHeading
        id="blog-title"
        as="h1"
        eyebrow="/blog"
        title={t('blog.title')}
        description={t('blog.subtitle')}
      />

      {isPending && <p className="font-mono text-sm text-ink-dim">{t('common.loading')}</p>}
      {isError && <ErrorState onRetry={refetch} />}

      {data && (
        <ul className="flex flex-col divide-y divide-line border-y border-line">
          {data.data.map((post) => (
            <li key={post.slug}>
              <LocalizedLink
                to={paths.post(post.slug)}
                className="group flex flex-col gap-2 py-8 md:flex-row md:items-baseline md:justify-between md:gap-10"
              >
                <span className="font-display text-2xl font-semibold text-ink transition-colors group-hover:text-ember md:text-3xl">
                  {post.title}
                </span>
                <span className="shrink-0 font-mono text-xs text-ink-dim">
                  {post.category?.name} · {t('common.minRead', { count: post.reading_time })}
                </span>
              </LocalizedLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
