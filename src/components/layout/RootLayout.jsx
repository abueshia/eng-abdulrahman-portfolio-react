import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { PageTransition } from './PageTransition';
import { ScrollManager } from './ScrollManager';
import { ScrollProgress } from './ScrollProgress';

/** Minimal, layout-stable fallback while a page chunk downloads. */
function PageFallback() {
  const { t } = useTranslation();
  return (
    <div className="grid min-h-[60vh] place-items-center" role="status">
      <span className="font-mono text-sm text-ink-dim">
        {t('common.loading')}
        <span className="ms-1 inline-block animate-blink text-ember">▍</span>
      </span>
    </div>
  );
}

/**
 * Application shell shared by every route: skip link, progress bar, navbar,
 * animated page outlet and footer. Landmarks: <header>, <main>, <footer>.
 */
export function RootLayout() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="fixed start-4 top-4 z-[100] -translate-y-24 rounded-full bg-ember px-5 py-3 text-sm font-medium text-on-ember transition-transform focus:translate-y-0"
      >
        {t('a11y.skipToContent')}
      </a>
      <ScrollManager />
      <ScrollProgress />
      <Navbar />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Suspense fallback={<PageFallback />}>
          <PageTransition />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
