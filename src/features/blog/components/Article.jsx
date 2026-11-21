import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import '@/i18n/sections';
import '@/i18n/work';
import { LineIcon } from '@/components/ui/LineIcon';
import { LocalizedLink } from '@/components/ui/LocalizedLink';
import { paths } from '@/config/routes';
import { SampleBadge } from '@/features/projects/components/SampleBadge';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { BlogIndex } from './BlogIndex';

/**
 * Reading progress through the article body, written to a CSS variable on
 * the bar (scroll-linked, one frame per scroll at most, no re-render).
 * @param {import('react').RefObject<HTMLElement | null>} bodyRef
 * @param {import('react').RefObject<HTMLElement | null>} barRef
 */
function useReadingProgress(bodyRef, barRef) {
  useEffect(() => {
    const body = bodyRef.current;
    const bar = barRef.current;
    if (!body || !bar) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = body.getBoundingClientRect();
      const total = Math.max(1, rect.height - window.innerHeight * 0.6);
      const progress = Math.min(1, Math.max(0, (window.innerHeight * 0.4 - rect.top) / total));
      bar.style.setProperty('--read', progress.toFixed(4));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [bodyRef, barRef]);
}

/**
 * The heading currently being read (the last one above the reading line).
 * @param {import('react').RefObject<HTMLElement | null>} bodyRef
 * @param {Array<{ id: string }>} toc
 */
function useActiveHeading(bodyRef, toc) {
  const [active, setActive] = useState(/** @type {string | null} */ (null));
  useEffect(() => {
    const body = bodyRef.current;
    if (!body || toc.length === 0) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.3;
      let current = null;
      for (const { id } of toc) {
        const heading = document.getElementById(id);
        if (heading && heading.getBoundingClientRect().top <= line) current = id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, [bodyRef, toc]);
  return active;
}

/**
 * Copy buttons inside the (prerendered) article HTML: one delegated listener.
 * @param {import('react').MouseEvent<HTMLDivElement>} event
 */
function onBodyClick(event) {
  const button = /** @type {HTMLElement | null} */ (
    /** @type {HTMLElement} */ (event.target).closest('[data-copy]')
  );
  if (!button) return;
  const code = button.closest('.code-block')?.querySelector('pre')?.textContent ?? '';
  const original = button.textContent;
  navigator.clipboard
    ?.writeText(code)
    .then(() => {
      button.textContent = button.dataset.copiedLabel ?? original;
      button.dataset.copied = 'true';
      window.setTimeout(() => {
        button.textContent = original;
        delete button.dataset.copied;
      }, 1600);
    })
    .catch(() => {});
}

/**
 * An article, read like documentation: 68ch measure, a sticky table of
 * contents marking the section being read, a reading-progress bar, code with
 * file tabs and copy buttons (highlighted at build time), related notes.
 *
 * @param {{ post: any }} props
 */
export function Article({ post }) {
  const { t } = useTranslation();
  const { scrollTo } = useSmoothScroll();
  const bodyRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const barRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const toc = post.toc ?? [];
  const active = useActiveHeading(bodyRef, toc);
  useReadingProgress(bodyRef, barRef);

  const jump = (/** @type {import('react').MouseEvent} */ event, /** @type {string} */ id) => {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    window.history.replaceState(window.history.state, '', `#${id}`);
    scrollTo(target, { offset: -96 });
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  };

  return (
    <article className="post" aria-labelledby="post-title">
      <div ref={barRef} className="post__progress" aria-hidden="true" />

      <header className="post__head container-fluid">
        <nav aria-label={t('caseStudy.breadcrumb')}>
          <ol className="cs__crumbs">
            <li>
              <LocalizedLink to={paths.home()}>{t('caseStudy.home')}</LocalizedLink>
            </li>
            <li>
              <LocalizedLink to={paths.blog()}>{t('nav.blog')}</LocalizedLink>
            </li>
            <li aria-current="page">{post.title}</li>
          </ol>
        </nav>
        <p className="post__version" dir="ltr">
          ## [{post.published_at?.slice(0, 10)}] · {post.category?.slug}
        </p>
        <h1 id="post-title" className="post__title">
          {post.title}
        </h1>
        <p className="post__excerpt">{post.excerpt}</p>
        <p className="post__meta">
          <span>
            {t('blog.published')}{' '}
            <time dateTime={post.published_at} dir="ltr">
              {post.published_at?.slice(0, 10)}
            </time>
          </span>
          {post.category?.name && <span>{post.category.name}</span>}
          <span>{t('common.minRead', { count: post.reading_time })}</span>
          {post.is_sample && <SampleBadge />}
        </p>
      </header>

      {post.cover_image && (
        <figure className="post__cover container-fluid">
          <img
            src={post.cover_image}
            alt={post.cover_alt ?? ''}
            width={1600}
            height={900}
            fetchPriority="high"
            decoding="async"
          />
        </figure>
      )}

      <div className="post__layout container-fluid">
        {toc.length > 0 && (
          <aside className="post__aside">
            <nav className="toc" aria-label={t('blog.toc')}>
              <p className="toc__title">{t('blog.toc')}</p>
              <ol className="toc__list">
                {toc.map((entry) => (
                  <li key={entry.id} className="toc__item" data-level={entry.level}>
                    <a
                      href={`#${entry.id}`}
                      className="toc__link"
                      aria-current={active === entry.id ? 'location' : undefined}
                      onClick={(event) => jump(event, entry.id)}
                    >
                      {entry.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>
        )}

        <div className="post__main">
          {post.is_sample && (
            <p className="cs__notice" role="note">
              {t('blog.sampleNotice')}
            </p>
          )}
          <div
            ref={bodyRef}
            className="prose"
            onClick={onBodyClick}
            // Sanitised by DOMPurify in the article pipeline (lib/article.js).
            dangerouslySetInnerHTML={{ __html: post.content_html }}
          />
          {post.tags?.length > 0 && (
            <ul className="post__tags" dir="ltr">
              {post.tags.map((tag) => (
                <li key={tag}>#{tag}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {post.related_posts?.length > 0 && (
        <section className="post__related container-fluid" aria-labelledby="post-related">
          <h2 id="post-related" className="post__related-title">
            {t('blog.related')}
          </h2>
          <BlogIndex posts={post.related_posts} headingLevel="h3" compact />
          <LocalizedLink to={paths.blog()} className="blog-section__all">
            {t('blog.back')}
            <LineIcon name="arrow" className="blog-section__all-icon" />
          </LocalizedLink>
        </section>
      )}
    </article>
  );
}
