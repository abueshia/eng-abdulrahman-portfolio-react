import { lazy } from 'react';
import { useTranslation } from 'react-i18next';

import { Section } from '@/components/layout/Section';
import { SectionFx } from '@/components/layout/SectionFx';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getStation, stationForSection } from '@/config/journey';
import { useSettings } from '@/hooks/useSettings';
import { useStats } from '../hooks/useStats';
import { digitsOf, hasData, sparkPaths, stepSeries } from '../lib/metrics';

const StatsDirector = lazy(() => import('../fx/StatsDirector'));

const SPARK = { width: 240, height: 64 };

/**
 * Odometer. The number is real text in the HTML (what crawlers, screen
 * readers and no-JS visitors get); the reels are decorative, their digits are
 * CSS-generated, and they only replace the text once the director runs
 * (`data-live`), rolling each column on its own with the scroll.
 * @param {{ value: number, suffix?: string }} props
 */
function Odometer({ value, suffix }) {
  return (
    <span className="odo" data-odo dir="ltr">
      <span className="odo__text">
        {value}
        {suffix}
      </span>
      <span className="odo__reels" aria-hidden="true">
        {digitsOf(value).map((digit, i) => (
          <span key={i} className="odo__col" data-digit={digit}>
            <span className="odo__reel" />
          </span>
        ))}
        {suffix && <span className="odo__suffix">{suffix}</span>}
      </span>
    </span>
  );
}

/** @param {{ series: number[] | null }} props */
function Sparkline({ series }) {
  const { line, area } = sparkPaths(series, SPARK);
  return (
    <svg
      className="panel__spark"
      viewBox={`0 0 ${SPARK.width} ${SPARK.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {area && <path className="panel__area" d={area} data-spark-area />}
      <path className="panel__line" d={line} pathLength={1} data-spark-line />
    </svg>
  );
}

/**
 * One metric panel. With data: odometer + stepped series. Without: an honest
 * "No data" state (the label stays, so the board still reads as complete).
 * @param {{ metric: import('../lib/metrics').Metric, slot: number }} props
 */
function MetricPanel({ metric, slot }) {
  const { t } = useTranslation();
  const live = hasData(metric);
  const titleId = `stat-${metric.key}`;

  return (
    <article
      className="panel"
      data-panel
      data-slot={slot}
      data-state={live ? 'ok' : 'empty'}
      aria-labelledby={titleId}
    >
      <header className="panel__bar">
        <span className="panel__dot" aria-hidden="true" />
        <h3 id={titleId} className="panel__title">
          {metric.label}
        </h3>
        <span className="panel__state">{live ? t('stats.healthy') : t('stats.noData')}</span>
      </header>
      <p className="panel__value">
        {live ? (
          <Odometer value={metric.value} suffix={metric.suffix} />
        ) : (
          <span className="panel__empty">{t('stats.awaiting')}</span>
        )}
      </p>
      <Sparkline series={live ? stepSeries(metric.value) : null} />
      <p className="panel__meta" aria-hidden="true" dir="ltr">
        <span>metrics.{metric.key}</span>
        <span>{live ? `${t('stats.series')} · 0 → ${metric.value}` : 'null'}</span>
      </p>
    </article>
  );
}

/**
 * Health panel: the only "live" facts are real settings (availability and the
 * owner's time zone); the heartbeat is an ambient CSS loop.
 * @param {{ general: any }} props
 */
function HealthPanel({ general }) {
  const { t } = useTranslation();
  const open = general?.available_for_work !== false;
  return (
    <article
      className="panel panel--health"
      data-panel
      data-slot="health"
      aria-labelledby="stat-health"
    >
      <header className="panel__bar">
        <span className="panel__dot" aria-hidden="true" />
        <h3 id="stat-health" className="panel__title">
          {t('stats.health.title')}
        </h3>
        <span className="panel__state">{t('stats.healthy')}</span>
      </header>
      <p className="panel__headline">{t('stats.health.operational')}</p>
      <svg
        className="panel__pulse"
        viewBox="0 0 240 40"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 22 H86 L94 22 L100 6 L108 36 L116 14 L122 22 H240" pathLength={1} />
      </svg>
      <dl className="panel__facts">
        <div>
          <dt>{t('stats.health.availability')}</dt>
          <dd data-open={open}>{open ? t('stats.health.open') : t('stats.health.closed')}</dd>
        </div>
        {general?.timezone && (
          <div>
            <dt>{t('stats.health.region')}</dt>
            <dd dir="ltr">{general.timezone}</dd>
          </div>
        )}
      </dl>
    </article>
  );
}

/**
 * Stats, the Observability tap: a live monitoring board watching the request
 * go by. Asymmetric bento (the one real figure leads), Grafana-like panels,
 * per-digit odometers and stepped series drawn by the scroll (director).
 */
export default function StatsSection() {
  const { t } = useTranslation();
  const { data } = useStats();
  const { data: settings } = useSettings();
  const metrics = /** @type {import('../lib/metrics').Metric[]} */ (data?.data ?? []);
  // Panels with data lead the board; empty ones follow in API order.
  const ordered = [...metrics.filter(hasData), ...metrics.filter((m) => !hasData(m))];

  return (
    <Section id="stats" className="stats">
      <div className="container-fluid stats__layout">
        <SectionHeading
          id="stats-title"
          index={getStation(stationForSection('stats'))?.code}
          eyebrow={t('stats.board')}
          title={t('sections.stats')}
          description={t('stats.lead')}
        />
        <div className="stats__board" data-stats-board>
          <span className="stats__scan" aria-hidden="true" data-stats-scan />
          {ordered.map((metric, i) => (
            <MetricPanel key={metric.key} metric={metric} slot={i} />
          ))}
          <HealthPanel general={settings?.data?.general} />
        </div>
      </div>
      <SectionFx target="stats">
        <StatsDirector />
      </SectionFx>
    </Section>
  );
}
