import { lazy, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LuArrowUpRight } from 'react-icons/lu';

import '@/i18n/work';
import { Section } from '@/components/layout/Section';
import { SectionFx } from '@/components/layout/SectionFx';
import { LineIcon } from '@/components/ui/LineIcon';
import { LocalizedLink } from '@/components/ui/LocalizedLink';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getStation, stationForSection } from '@/config/journey';
import { paths, SECTION_IDS } from '@/config/routes';
import { useServices } from '../hooks/useServices';
import { endpointPath, groupServices, responseFields } from '../lib/contract';

const ServicesDirector = lazy(() => import('../fx/ServicesDirector'));

/**
 * Border spotlight: the pointer position inside the hovered route, as CSS
 * variables (one delegated listener, mouse only, no re-render).
 * @param {import('react').PointerEvent<HTMLElement>} event
 */
function trackSpotlight(event) {
  if (event.pointerType !== 'mouse') return;
  const route = /** @type {HTMLElement | null} */ (
    /** @type {HTMLElement} */ (event.target).closest('[data-route]')
  );
  if (!route) return;
  const rect = route.getBoundingClientRect();
  route.style.setProperty('--mx', `${(event.clientX - rect.left).toFixed(0)}px`);
  route.style.setProperty('--my', `${(event.clientY - rect.top).toFixed(0)}px`);
}

/**
 * The response body, printed as JSON but built from real elements: values
 * are text (lists are real lists with localised labels), while the JSON
 * punctuation and keys are decoration hidden from assistive technology.
 * @param {{ service: import('../lib/contract').Service }} props
 */
function JsonBody({ service }) {
  const { t } = useTranslation();
  const fields = responseFields(service);
  const labels = {
    deliverables: t('services.deliverables'),
    stack: t('services.stack'),
  };
  return (
    <div className="json" dir="ltr">
      <span className="json__punct" aria-hidden="true">
        {'{'}
      </span>
      {fields.map(([key, value], f) => {
        const last = f === fields.length - 1;
        if (!Array.isArray(value)) {
          return (
            <p key={key} className="json__row" style={{ '--i': f }}>
              <span className="json__key" aria-hidden="true">
                &quot;{key}&quot;:{' '}
              </span>
              <span className="json__str">
                <span aria-hidden="true">&quot;</span>
                {value}
                <span aria-hidden="true">&quot;</span>
              </span>
              {!last && <span aria-hidden="true">,</span>}
            </p>
          );
        }
        return (
          <div key={key} className="json__row" style={{ '--i': f }}>
            <span className="json__key" aria-hidden="true">
              &quot;{key}&quot;: [
            </span>
            <ul
              className={key === 'stack' ? 'json__list json__list--inline' : 'json__list'}
              aria-label={labels[/** @type {'deliverables' | 'stack'} */ (key)] ?? key}
            >
              {value.map((item, i) => (
                <li key={item} className="json__item" style={{ '--i': f + i * 0.5 + 1 }}>
                  <span aria-hidden="true">&quot;</span>
                  <bdi className="json__str">{item}</bdi>
                  <span aria-hidden="true">&quot;{i < value.length - 1 ? ',' : ''}</span>
                </li>
              ))}
            </ul>
            <span className="json__key" aria-hidden="true">
              ]{!last && ','}
            </span>
          </div>
        );
      })}
      <span className="json__punct" aria-hidden="true">
        {'}'}
      </span>
    </div>
  );
}

/**
 * One service as a route: `METHOD /services/{slug} ……… Title`. A native
 * `<details>` disclosure (works without JS, opens on find-in-page), whose
 * body is the contract's `200 OK` response.
 * @param {{ service: import('../lib/contract').Service, open?: boolean }} props
 */
function ServiceRoute({ service, open = false }) {
  const { t } = useTranslation();
  const endpoint = endpointPath(service);
  return (
    <li className="route" data-route>
      <details className="route__details" open={open}>
        <summary className="route__summary">
          <span className="route__line" dir="ltr">
            <span className="route__method" data-method={service.method}>
              {service.method}
            </span>
            <span className="route__path">{endpoint}</span>
          </span>
          <span className="route__leader" aria-hidden="true" data-route-leader />
          <h4 className="route__title">{service.title}</h4>
          <span className="route__toggle" aria-hidden="true">
            <LineIcon name="plus" />
          </span>
        </summary>
        <div className="route__body">
          <p className="route__desc">{service.description}</p>
          <div
            className="route__response"
            role="group"
            aria-label={t('services.responseLabel', { endpoint: `${service.method} ${endpoint}` })}
          >
            <p className="route__status" dir="ltr">
              <span className="route__http">HTTP/1.1</span> <b>200 OK</b>
              <span className="route__type">application/json</span>
            </p>
            <JsonBody service={service} />
          </div>
          <LocalizedLink to={paths.section(SECTION_IDS.contact)} className="route__cta">
            {t('services.cta')}
            <LuArrowUpRight aria-hidden="true" className="route__cta-icon" />
          </LocalizedLink>
        </div>
      </details>
    </li>
  );
}

/**
 * Services, the ENDPOINTS station ("API Contracts"): every service is an
 * endpoint with a contract, listed like `php artisan route:list`, grouped by
 * route prefix (Backend & Integrations, Frontend, Growth, Infra & AI,
 * Support). Every title, description and deliverable is prerendered text.
 *
 * - A group index (sticky on desktop) jumps between prefixes and marks the
 *   group being read.
 * - Hovering a route draws a spotlight on its border that follows the mouse.
 * - The director registers the routes as the scan line passes them (method
 *   badges go live, leaders draw), all scrubbed.
 */
export default function ServicesSection() {
  const { t } = useTranslation();
  const { data } = useServices();
  const groups = useMemo(() => groupServices(data?.data ?? []), [data]);

  return (
    <Section id="services" className="services">
      <div className="container-fluid services__layout">
        <SectionHeading
          id="services-title"
          index={getStation(stationForSection('services'))?.code}
          eyebrow={<span dir="ltr">{t('services.command')}</span>}
          title={t('sections.services')}
          description={t('services.lead')}
        />

        <div className="routes" data-routes>
          <nav className="routes__index" aria-label={t('services.groups')}>
            <ol>
              {groups.map(({ group, services }) => (
                <li key={group.slug}>
                  <LocalizedLink
                    to={paths.section(`services-${group.slug}`)}
                    className="routes__link"
                    data-routes-link={group.slug}
                  >
                    <span className="routes__prefix" dir="ltr">
                      /{group.slug}
                    </span>
                    <span className="routes__name">{group.name}</span>
                    <span className="routes__count">
                      {t('services.count', { count: services.length })}
                    </span>
                  </LocalizedLink>
                </li>
              ))}
            </ol>
          </nav>

          <div className="routes__table" onPointerMove={trackSpotlight}>
            <span className="routes__scan" aria-hidden="true" data-routes-scan />
            {groups.map(({ group, services }, g) => (
              <section
                key={group.slug}
                id={`services-${group.slug}`}
                className="routes__group"
                aria-labelledby={`services-${group.slug}-title`}
                data-routes-group={group.slug}
              >
                <h3 id={`services-${group.slug}-title`} className="routes__group-title">
                  <span className="routes__group-prefix" dir="ltr">
                    Route::prefix(&apos;{group.slug}&apos;)
                  </span>
                  {group.name}
                </h3>
                <ul className="routes__list">
                  {services.map((service, i) => (
                    <ServiceRoute key={service.slug} service={service} open={g === 0 && i === 0} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>
      <SectionFx target="services">
        <ServicesDirector />
      </SectionFx>
    </Section>
  );
}
