// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { processArticle, slugify } from './article';

const LABELS = { copyLabel: 'Copy', copiedLabel: 'Copied' };

describe('article pipeline (build time, Node)', () => {
  it('sanitises scripts, handlers, styles and unknown attributes', async () => {
    const { html } = await processArticle(
      '<p onclick="steal()" style="color:red" data-x="1">Hi <script>alert(1)</script><img src="x.png" onerror="boom()" alt="pic"></p><iframe src="//evil"></iframe>',
      LABELS,
    );
    expect(html).toBe('<p>Hi <img src="x.png" alt="pic"></p>');
  });

  it('gives headings unique, Unicode-aware ids and builds the TOC', async () => {
    const { html, toc } = await processArticle(
      '<h2 id="forged">Why it matters</h2><h3>Why it matters</h3><h2>ما معنى Idempotency؟</h2>',
      LABELS,
    );
    expect(toc).toEqual([
      { id: 'why-it-matters', text: 'Why it matters', level: 2 },
      { id: 'why-it-matters-2', text: 'Why it matters', level: 3 },
      { id: 'ما-معنى-idempotency', text: 'ما معنى Idempotency؟', level: 2 },
    ]);
    expect(html).not.toContain('forged');
  });

  it('highlights supported languages with Shiki inside a file-tab figure', async () => {
    const { html } = await processArticle(
      '<pre><code class="language-php" data-filename="app/Job.php">$a = 1;</code></pre>',
      LABELS,
    );
    expect(html).toContain('<figure class="code-block" data-lang="php">');
    expect(html).toContain('<span class="code-block__file">app/Job.php</span>');
    expect(html).toContain('data-copied-label="Copied"');
    expect(html).toContain('--shiki-dark');
    expect(html).toContain('--shiki-light');
  });

  it('keeps unsupported languages as escaped plain code', async () => {
    const { html } = await processArticle(
      '<pre><code class="language-ruby">puts "&lt;b&gt;"</code></pre>',
      LABELS,
    );
    expect(html).toContain('data-lang="text"');
    expect(html).toContain('puts "&lt;b&gt;"');
  });

  it('opens external links safely', async () => {
    const { html } = await processArticle('<p><a href="https://example.com">x</a></p>', LABELS);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('slugifies to a fallback when nothing is left', () => {
    expect(slugify('?!')).toBe('section');
  });
});
