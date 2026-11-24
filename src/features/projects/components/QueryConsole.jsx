import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { useHydrated } from '@/hooks/useHydrated';
import { cn } from '@/utils/cn';
import { EASE } from '@/utils/motion';
import { describeQuery } from '../lib/filters';

/**
 * One facet row: `type: [all] [saas] [web_app] …` as toggle buttons. The active
 * pill lands on the chosen option (motion, on state change).
 * @param {{
 *   id: string, label: string, value: string | null, allLabel: string,
 *   options: Array<{ slug: string, label: string }>,
 *   onChange: (value: string | null) => void, hydrated: boolean,
 * }} props
 */
function Facet({ id, label, value, allLabel, options, onChange, hydrated }) {
  const choices = [{ slug: null, label: allLabel }, ...options];
  return (
    <div className="query__facet">
      <span id={`facet-${id}`} className="query__key" dir="ltr">
        {label}
      </span>
      <ul className="query__chips" aria-labelledby={`facet-${id}`}>
        {choices.map((choice) => {
          const active = value === choice.slug;
          return (
            <li key={choice.slug ?? '*'}>
              <button
                type="button"
                className={cn('query__chip', active && 'is-active')}
                aria-pressed={active}
                onClick={() => onChange(active ? null : choice.slug)}
              >
                {active && (
                  <m.span
                    className="query__pill"
                    initial={hydrated ? { scale: 0.7, opacity: 0 } : false}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.35, ease: EASE.snap }}
                    aria-hidden="true"
                  />
                )}
                <span className="query__chip-label">{choice.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * The filter UI, framed as the query that pulls the case files: the SQL line
 * is rewritten by the filter state, and the result line reports the rows in
 * set (announced politely to screen readers).
 * @param {{
 *   filters: import('../lib/filters').ProjectFilters,
 *   facets: ReturnType<typeof import('../lib/filters').facets>,
 *   count: number,
 *   onChange: (next: import('../lib/filters').ProjectFilters) => void,
 * }} props
 */
export function QueryConsole({ filters, facets, count, onChange }) {
  const { t } = useTranslation();
  const sql = describeQuery(filters);
  const filtered = Boolean(filters.type || filters.tech);
  // The prerendered (and hydrating) line is final; only later rewrites type in.
  const hydrated = useHydrated();

  return (
    <div className="query" role="group" aria-label={t('projects.filters')}>
      <p className="query__sql" dir="ltr" aria-hidden="true">
        <span className="query__prompt">mysql&gt;</span>{' '}
        <m.code
          key={sql}
          className="query__code"
          initial={hydrated ? { clipPath: 'inset(0% 100% 0% 0%)' } : false}
          animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          transition={{ duration: 0.5, ease: EASE.snap }}
        >
          {sql}
        </m.code>
      </p>
      <div className="query__facets">
        <Facet
          id="type"
          label={t('projects.type')}
          value={filters.type}
          allLabel={t('projects.all')}
          options={facets.types.map((type) => ({ slug: type.slug, label: type.label }))}
          onChange={(type) => onChange({ ...filters, type })}
          hydrated={hydrated}
        />
        <Facet
          id="tech"
          label={t('projects.tech')}
          value={filters.tech}
          allLabel={t('projects.all')}
          options={facets.techs.map((tech) => ({ slug: tech.slug, label: tech.name }))}
          onChange={(tech) => onChange({ ...filters, tech })}
          hydrated={hydrated}
        />
      </div>
      <p className="query__status">
        <span role="status" aria-live="polite" className="query__rows">
          <span aria-hidden="true" className="query__arrow">
            →
          </span>{' '}
          {t('projects.rows', { count })}
        </span>
        {filtered && (
          <button
            type="button"
            className="query__clear"
            onClick={() => onChange({ type: null, tech: null })}
          >
            {t('projects.clear')}
          </button>
        )}
      </p>
    </div>
  );
}
