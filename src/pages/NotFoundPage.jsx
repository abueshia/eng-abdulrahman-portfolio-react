import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { LocalizedLink } from '@/components/ui/LocalizedLink';
import { Seo } from '@/components/ui/Seo';
import { stripLocale } from '@/config/routes';

/** 404 page, framed as a failed HTTP request. */
export default function NotFoundPage() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <div className="container-fluid grid min-h-[80svh] place-items-center pt-[var(--nav-height)]">
      <Seo title={t('meta.notFoundTitle')} noIndex status={404} />
      <div className="flex w-full max-w-2xl flex-col gap-8">
        <pre
          dir="ltr"
          className="overflow-x-auto rounded-lg border border-line bg-surface p-5 text-start font-mono text-xs leading-relaxed text-ink-muted sm:text-sm"
        >
          <span className="text-ink-dim">$ </span>
          <span className="text-ink">curl -i</span> {stripLocale(pathname)}
          {'\n'}
          <span className="text-danger">HTTP/1.1 404 Not Found</span>
          {'\n'}
          {'{ "success": false, "data": null }'}
        </pre>
        <h1 className="font-display text-display-lg font-bold tracking-tight">
          <span className="text-ember">{t('notFound.code')}</span> {t('notFound.title')}
        </h1>
        <p className="text-lg text-ink-muted">{t('notFound.description')}</p>
        <Button as={LocalizedLink} to="/" size="lg" className="self-start">
          {t('common.backHome')}
        </Button>
      </div>
    </div>
  );
}
