/**
 * TEMPORARY hero for phase 1: verifies settings data and typography tokens.
 * Replaced by the cinematic hero (features/hero) in phase 2.
 */
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { LocalizedLink } from '@/components/ui/LocalizedLink';
import { paths, SECTION_IDS } from '@/config/routes';
import { useSettings } from '@/hooks/useSettings';

export function HeroPlaceholder() {
  const { t } = useTranslation();
  const { data, isPending } = useSettings();
  const general = data?.data?.general;
  const hero = data?.data?.hero;

  return (
    <section
      id={SECTION_IDS.hero}
      aria-labelledby="hero-title"
      className="relative flex min-h-[100svh] items-center overflow-hidden pt-[var(--nav-height)]"
    >
      {/* Token preview: grid + glows that the real background layer will animate. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(var(--grid-line)_1px,transparent_1px),linear-gradient(90deg,var(--grid-line)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] [background-size:64px_64px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -start-40 bottom-0 size-[36rem] rounded-full bg-ember/20 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-40 top-10 size-[30rem] rounded-full bg-ion/15 blur-[120px]"
      />

      <div className="container-fluid relative flex flex-col gap-8">
        <p className="font-mono text-xs tracking-widest text-ink-dim uppercase" dir="ltr">
          <span className="text-signal">●</span> {hero?.terminal_stack_command ?? '…'}
        </p>
        <h1
          id="hero-title"
          className="font-display text-display-xl font-bold tracking-tighter text-ink"
        >
          {isPending ? t('common.loading') : general?.first_name}
          <span className="text-outline block">{general?.last_name}</span>
        </h1>
        <p className="max-w-2xl text-lg text-pretty text-ink-muted md:text-xl">{hero?.summary}</p>
        <div className="flex flex-wrap gap-3">
          <Button as={LocalizedLink} to={paths.projects()} size="lg">
            {t('nav.projects')}
          </Button>
          <Button
            as={LocalizedLink}
            to={paths.section(SECTION_IDS.contact)}
            variant="secondary"
            size="lg"
          >
            {t('nav.cta')}
          </Button>
        </div>
      </div>
    </section>
  );
}
