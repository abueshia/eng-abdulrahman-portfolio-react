import { useTranslation } from 'react-i18next';
import { useRouteError } from 'react-router-dom';

/**
 * Last-resort boundary for errors thrown while rendering a route. Lives
 * outside the locale/layout providers on purpose, so it must stay minimal.
 */
export function RouteError() {
  const error = useRouteError();
  const { t } = useTranslation();

  if (import.meta.env.DEV) console.error(error);

  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-6 text-ink">
      <div role="alert" className="flex max-w-lg flex-col gap-4 text-center">
        <p className="font-mono text-sm text-danger" dir="ltr">
          500 · Internal Error
        </p>
        <h1 className="font-display text-3xl font-semibold">{t('common.error')}</h1>
        <a href="/" className="text-ion underline underline-offset-4">
          {t('common.backHome')}
        </a>
      </div>
    </main>
  );
}
