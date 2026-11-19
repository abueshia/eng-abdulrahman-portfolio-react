import { useTranslation } from 'react-i18next';

import { Button } from './Button';

/**
 * Inline error state with an optional retry action.
 * @param {{ onRetry?: () => void, message?: string }} props
 */
export function ErrorState({ onRetry, message }) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-4 rounded-lg border border-danger/40 bg-danger/5 p-6"
    >
      <p className="font-mono text-sm text-danger" dir="ltr">
        ✕ ERR
      </p>
      <p className="text-ink-muted">{message ?? t('common.error')}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  );
}
