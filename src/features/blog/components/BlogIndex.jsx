import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import '@/i18n/sections';
import '@/i18n/work';
import { LocalizedLink } from '@/components/ui/LocalizedLink';
import { paths } from '@/config/routes';
import { SampleBadge } from '@/features/projects/components/SampleBadge';

/**
 * Cursor position inside the index, as CSS variables (mouse only, one frame
 * per move at most, no re-render). The preview itself is CSS.
 * @param {import('react').PointerEvent<HTMLElement>} event
 */
function follow(event) {
  if (event.pointerType !== 'mouse') return;
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty('--px', `${(event.clientX - rect.left).toFixed(0)}px`);
  el.style.setProperty('--py', `${(event.clientY - rect.top).toFixed(0)}px`);
}

/**
 * Editorial index of notes: huge titles, a changelog-style version line per
 * entry, and (desktop, mouse only) a preview of the hovered note's cover that
 * follows the cursor. Every title, excerpt and date is real text; the
 * preview is decoration.
 *
 * @param {{ posts: any[], headingLevel?: 'h2' | 'h3', compact?: boolean }} props
 */
export function BlogIndex({ posts, headingLevel: Heading = 'h2', compact = false }) {
  const { t } = useTranslation();
  const [active, setActive] = useState(-1);
  const listRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  return (
    <div
      ref={listRef}
      className="notes"
      data-compact={compact ? 'true' : undefined}
      onPointerMove={follow}
      onPointerLeave={() => setActive(-1)}
      data-notes
    >
      <ol className="notes__list">
        {posts.map((post, i) => (
          <li
            key={post.slug}
            className="note"
            data-note
            data-active={active === i ? 'true' : undefined}
            onPointerEnter={(event) => event.pointerType === 'mouse' && setActive(i)}
          >
            <article className="note__body" aria-labelledby={`note-${post.slug}`}>
              <p className="note__version" dir="ltr" aria-hidden="true">
                ## [{post.published_at?.slice(0, 10)}]
              </p>
              <p className="note__meta">
                <time dateTime={post.published_at} dir="ltr">
                  {post.published_at?.slice(0, 10)}
                </time>
                {post.category?.name && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="note__cat">{post.category.name}</span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span>{t('common.minRead', { count: post.reading_time })}</span>
                {post.is_sample && <SampleBadge />}
              </p>
              <Heading id={`note-${post.slug}`} className="note__title" data-note-title>
                <LocalizedLink to={paths.post(post.slug)} className="note__link">
                  {post.title}
                </LocalizedLink>
              </Heading>
              {!compact && <p className="note__excerpt">{post.excerpt}</p>}
            </article>
          </li>
        ))}
      </ol>
      <div className="notes__preview" aria-hidden="true">
        {posts.map((post, i) => (
          <img
            key={post.slug}
            src={post.cover_image}
            alt=""
            width={1600}
            height={900}
            loading="lazy"
            decoding="async"
            data-active={active === i ? 'true' : undefined}
          />
        ))}
      </div>
    </div>
  );
}
