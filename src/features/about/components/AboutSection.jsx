import { lazy, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Section } from '@/components/layout/Section';
import { SectionFx } from '@/components/layout/SectionFx';
import { getStation, stationForSection } from '@/config/journey';
import { useSettings } from '@/hooks/useSettings';
import { AUTH_TOKEN, PRINCIPLE_LINES, STORY_LINES, buildProfileCode } from '../lib/profile-code';

const AboutDirector = lazy(() => import('../fx/AboutDirector'));

/**
 * The AUTH gate the request passes on its way in. Decorative (`aria-hidden`):
 * its default, prerendered state is the final one (verified, open), so
 * without the director nothing is hidden or missing. The director turns it
 * into a scrubbed scene: the token is verified glyph by glyph, the lock
 * opens and the doors part on the welcome.
 * @param {{ name?: string }} props
 */
function AuthGate({ name }) {
  const { t } = useTranslation();
  return (
    <div className="auth" data-auth aria-hidden="true">
      <div className="auth__stage">
        <p className="auth__welcome" data-auth-welcome>
          {t('about.auth.welcome', { name })}
        </p>
        <div className="auth__door auth__door--start" data-auth-door="start">
          <span dir="ltr">final class</span>
        </div>
        <div className="auth__door auth__door--end" data-auth-door="end">
          <span dir="ltr">AbdulrahmanAbuEisha</span>
        </div>
        <div className="auth__core" data-auth-core>
          <svg className="auth__lock" viewBox="0 0 40 48" data-auth-lock>
            <path
              className="auth__shackle"
              d="M10 22 V14 a10 10 0 0 1 20 0 V22"
              data-auth-shackle
            />
            <rect className="auth__body" x="5" y="22" width="30" height="22" rx="5" />
            <circle className="auth__key" cx="20" cy="32" r="3" />
          </svg>
          <p className="auth__req" dir="ltr">
            <b>POST</b> /auth <span className="auth__arrow">→</span>{' '}
            <span className="auth__states">
              <span className="auth__pending" data-auth-pending>
                {t('about.auth.verifying')}
              </span>
              <span className="auth__status" data-auth-status>
                {t('about.auth.granted')}
              </span>
            </span>
          </p>
          <p className="auth__token" dir="ltr">
            {AUTH_TOKEN.split('').map((char, i) => (
              <span key={i} data-auth-char>
                {char}
              </span>
            ))}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * @param {{ lines: import('../lib/profile-code').CodeLine[] }} props
 */
function CodeCard({ lines }) {
  const { t } = useTranslation();
  return (
    <figure className="code" data-code aria-label={t('about.codeLabel')}>
      <figcaption className="code__bar" dir="ltr">
        <span className="code__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        {t('about.codeFile')}
      </figcaption>
      <div className="code__viewport">
        {/* Scrollable on small screens: focusable so the keyboard can scroll it. */}
        <pre className="code__pre" dir="ltr" tabIndex={0}>
          <code className="code__body" data-code-scroller>
            {lines.map((line, n) => (
              <span key={n} className="code__line" data-line={line.key ?? undefined}>
                <span className="code__no" aria-hidden="true">
                  {n + 1}
                </span>
                {line.tokens.map(([kind, text], i) =>
                  kind === 'p' ? (
                    text
                  ) : (
                    <span key={i} className={`tok tok--${kind}`}>
                      {text}
                    </span>
                  ),
                )}
                {'\n'}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </figure>
  );
}

/**
 * About, the AUTH station: the system identifies its owner.
 *
 * An editorial README: a serif statement as the heading, the story revealed
 * word by word with the scroll (director), the principles, and beside them
 * the profile as a real PHP class whose highlighted line follows the
 * paragraph being read. Every word is prerendered.
 */
export default function AboutSection() {
  const { t } = useTranslation();
  const { data } = useSettings();
  const general = data?.data?.general;
  const about = data?.data?.about;
  const hero = data?.data?.hero;
  const company = general?.company;
  const code = useMemo(
    () =>
      buildProfileCode({
        stack: hero?.terminal_stack,
        years: general?.years_of_experience,
        company,
        timezone: general?.timezone,
      }),
    [hero?.terminal_stack, general?.years_of_experience, company, general?.timezone],
  );
  const story = /** @type {string[]} */ (about?.story ?? []);
  // Other spellings people search for, shown as plain readable text.
  const aka = /** @type {string[]} */ (general?.alternate_names ?? []);
  const principles = /** @type {Array<{ key: string, title: string, description: string }>} */ (
    about?.principles ?? []
  );

  return (
    <Section id="about" className="about">
      <AuthGate name={general?.first_name} />
      <div className="container-fluid about__grid">
        <div className="about__readme">
          <p className="about__eyebrow">
            <span className="text-ember">{getStation(stationForSection('about'))?.code}</span>
            <span aria-hidden="true" className="about__rule" />
            <span dir="ltr">{t('about.file')}</span>
          </p>
          <h2 id="about-title" className="about__quote">
            {about?.title}
          </h2>
          <p className="about__whoami">
            <span className="about__prompt" aria-hidden="true" dir="ltr">
              $ {t('about.whoami')}
            </span>
            <span>{general?.job_title}</span>
            {company?.name && (
              <span className="about__company">
                {t('about.companyLine', { role: company.role, company: company.name })}
              </span>
            )}
          </p>

          <div className="about__story">
            {story.map((paragraph, i) => (
              <p key={i} className="about__para" data-read data-line={STORY_LINES[i] ?? 'class'}>
                {paragraph}
              </p>
            ))}
          </div>
          {aka.length > 0 && (
            <p className="about__aka">
              <span className="about__aka-label">{t('about.aka')}</span> {aka.join(' · ')}
            </p>
          )}

          {principles.length > 0 && (
            <section className="about__principles" aria-labelledby="about-principles">
              <h3 id="about-principles" className="about__h3">
                <span aria-hidden="true" dir="ltr">
                  ##{' '}
                </span>
                {t('about.principles')}
              </h3>
              <ol className="about__list">
                {principles.map((principle) => (
                  <li
                    key={principle.key}
                    className="about__principle"
                    data-read
                    data-line={PRINCIPLE_LINES[principle.key] ?? 'class'}
                  >
                    <h4 className="about__h4">{principle.title}</h4>
                    <p>{principle.description}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
        <div className="about__aside">
          <CodeCard lines={code} />
        </div>
      </div>
      <SectionFx target="about">
        <AboutDirector />
      </SectionFx>
    </Section>
  );
}
