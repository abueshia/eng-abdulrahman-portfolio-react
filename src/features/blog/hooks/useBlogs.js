import '@/i18n/sections';
import i18n from '@/i18n';
import { useApiQuery } from '@/hooks/useApiQuery';
import { blogsService } from '@/services/api';

/**
 * Paginated blog list.
 * @param {{ category?: string, page?: number, per_page?: number }} [params]
 */
export function useBlogs(params = {}) {
  return useApiQuery(['blogs', params], (options) => blogsService.list(params, options), {
    placeholderData: (previous) => previous,
    staleTime: 5 * 60 * 1000,
  });
}

/** Blog categories (`GET /blogs/categories`). */
export function useBlogCategories() {
  return useApiQuery(['blog-categories'], blogsService.categories, { staleTime: 5 * 60 * 1000 });
}

/**
 * Single post by slug, with its HTML already processed (sanitised, heading
 * ids, Shiki-highlighted code) and its table of contents. The processing runs
 * inside the query, so during prerendering it happens at build time and the
 * finished HTML is what gets dehydrated: the hydrating client never loads
 * DOMPurify or Shiki for a prerendered article. The raw `content` is dropped.
 * @param {string | undefined} slug
 */
export function useBlog(slug) {
  return useApiQuery(
    ['blog', slug],
    async (options) => {
      const result = await blogsService.show(slug, options);
      const { processArticle } = await import('../lib/article');
      const { content, ...post } = result.data;
      const article = await processArticle(content, {
        copyLabel: i18n.t('blog.copy', { lng: options.lang }),
        copiedLabel: i18n.t('blog.copied', { lng: options.lang }),
      });
      return { ...result, data: { ...post, content_html: article.html, toc: article.toc } };
    },
    { enabled: Boolean(slug), staleTime: 5 * 60 * 1000 },
  );
}
