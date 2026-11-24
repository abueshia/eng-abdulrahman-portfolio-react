import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, m } from 'motion/react';
import { lazy, useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import '@/i18n/sections';
import { Section } from '@/components/layout/Section';
import { SectionFx } from '@/components/layout/SectionFx';
import { LineIcon } from '@/components/ui/LineIcon';
import { api, isLiveResource } from '@/config/api';
import { getStation, stationForSection } from '@/config/journey';
import { useLocale } from '@/hooks/useLocale';
import { useSettings } from '@/hooks/useSettings';
import { contactService } from '@/services/api';
import { EASE } from '@/utils/motion';
import {
  EMPTY_CONTACT,
  contactFieldFor,
  contactSchema,
  fingerprint,
  requestPreview,
  toPayload,
} from '../lib/schema';
import { openRelay, relayMessage, relayTarget } from '../lib/relay';

const ContactDirector = lazy(() => import('../fx/ContactDirector'));

/** @typedef {'idle' | 'sending' | 'success' | 'relayed' | 'invalid' | 'limited' | 'failure' | 'duplicate'} Phase */

const SWAP = {
  initial: { clipPath: 'inset(0% 0% 100% 0%)' },
  animate: { clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: 0.6, ease: EASE.outExpo } },
  exit: { clipPath: 'inset(100% 0% 0% 0%)', transition: { duration: 0.35, ease: EASE.shutter } },
};

/**
 * A labelled field with its error. Messages from zod are i18n keys; 422
 * messages come from the server as text and are shown as is.
 * @param {{ name: string, label: string, error?: { type?: string, message?: string },
 *   children: (props: Record<string, unknown>) => import('react').ReactNode, hint?: string }} props
 */
function Field({ name, label, error, children }) {
  const { t } = useTranslation();
  const errorId = `contact-${name}-error`;
  const message = error?.message
    ? error.type === 'server'
      ? error.message
      : t(error.message, { defaultValue: t('contact.errors.server') })
    : null;
  return (
    <div className="req__field" data-invalid={message ? 'true' : undefined}>
      <label htmlFor={`contact-${name}`} className="req__label">
        <span className="req__key" dir="ltr" aria-hidden="true">
          &quot;{name}&quot;:
        </span>
        {label}
      </label>
      {children({
        id: `contact-${name}`,
        'aria-invalid': message ? 'true' : 'false',
        'aria-describedby': message ? errorId : undefined,
      })}
      {message && (
        <p id={errorId} className="req__error">
          {message}
        </p>
      )}
    </div>
  );
}

/**
 * Contact, the REQUEST BUILDER station, then RESPONSE 201.
 *
 * - A compact intro: the `POST /contact` line, one headline (revealed word
 *   by word by the director) and the reply promise right under it.
 * - The form (react-hook-form + zod) beside a live preview of the exact
 *   `POST /contact` it will send, updated on every keystroke.
 * - Submitting turns the button into a progress bar; then "201 Created", or
 *   "500 — Retry", or the server's 422 errors on their fields. A honeypot
 *   catches bots, the same request is never sent twice, and HTML is refused.
 * - Live (`contact` in VITE_API_RESOURCES, the production setup): the
 *   request goes to `POST /contact`. 201 shows the confirmation; 422 errors
 *   land on their fields; 429 says "try again shortly"; a network or server
 *   failure offers Retry. The form never loses what the visitor typed.
 * - Not live: development says the message was not delivered; production
 *   relays to WhatsApp or the mail app (`api.contactRelay`).
 * - Direct channels (email, WhatsApp, phone) and `ls ~/socials` from the
 *   real settings are always there. Reaching them is the Response station.
 */
export default function ContactSection() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { data } = useSettings();
  const settings = data?.data;
  const general = settings?.general;
  const whatsapp = general?.socials?.find((s) => s.platform === 'whatsapp');
  const relay = api.contactRelay;
  const relayChannel = whatsapp ? 'whatsapp' : 'email';
  const [phase, setPhase] = useState(/** @type {Phase} */ ('idle'));
  const [response, setResponse] = useState(/** @type {any} */ (null));
  const [sentKey, setSentKey] = useState(/** @type {string | null} */ (null));
  const [relayed, setRelayed] = useState(
    /** @type {{ channel: 'whatsapp' | 'email', url: string } | null} */ (null),
  );
  /** Server message of a 422 that names no visible field. */
  const [formError, setFormError] = useState(/** @type {string | null} */ (null));
  /** The last failure was the network (no response), not the server. */
  const [offline, setOffline] = useState(false);
  const resultRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  const {
    register,
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: EMPTY_CONTACT,
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });
  const values = useWatch({ control, defaultValue: EMPTY_CONTACT });
  /** @param {string | undefined} value */
  const typeLabelOf = (value) =>
    settings?.contact?.project_types?.find((/** @type {any} */ type) => type.value === value)
      ?.label;

  useEffect(() => {
    if (phase === 'success' || phase === 'relayed' || phase === 'failure' || phase === 'limited') {
      resultRef.current?.focus();
    }
  }, [phase]);

  const onSubmit = handleSubmit(async (formValues) => {
    if (phase === 'sending') return;
    const typeLabel = typeLabelOf(formValues.type);
    const payload = toPayload(formValues, typeLabel);
    const key = fingerprint(payload);
    if (sentKey === key) {
      setPhase('duplicate');
      return;
    }
    if (relay) {
      const message = relayMessage(
        payload,
        {
          greeting: t('contact.relay.greeting', { name: payload.name }),
          email: t('contact.email'),
          phone: t('contact.phone'),
          type: t('contact.fields.type'),
        },
        typeLabel,
      );
      const target = relayTarget(
        {
          whatsapp: whatsapp?.url,
          email: general?.email,
          subject: t('contact.relay.subject', { name: payload.name }),
        },
        message,
      );
      if (!target) {
        setPhase('failure');
        return;
      }
      // Honeypot filled: look done, open nothing.
      if (!payload.website) openRelay(target);
      setSentKey(key);
      setRelayed(target);
      setPhase('relayed');
      return;
    }
    setPhase('sending');
    setFormError(null);
    try {
      const result = await contactService.send(payload);
      setSentKey(key);
      setResponse(result);
      setPhase('success');
    } catch (error) {
      const apiError = /** @type {any} */ (error);
      // The form keeps every value: only the phase changes.
      if (apiError?.isValidation) {
        let placed = false;
        Object.entries(apiError.errors ?? {}).forEach(([key, messages]) => {
          const field = contactFieldFor(key);
          if (!field) return;
          placed = true;
          setError(field, { type: 'server', message: [messages].flat()[0] });
        });
        if (!placed) setFormError(apiError.message || null);
        setPhase('invalid');
      } else if (apiError?.isRateLimited) {
        setPhase('limited');
      } else {
        setOffline(Boolean(apiError?.isNetwork));
        setPhase('failure');
      }
    }
  });

  const again = () => {
    reset(EMPTY_CONTACT);
    setResponse(null);
    setRelayed(null);
    setPhase('idle');
  };

  const titleWords = (settings?.cta?.title ?? t('sections.contact')).split(/\s+/);
  const socials = general?.socials?.filter((s) => s.platform !== 'whatsapp') ?? [];
  const status = {
    idle: t('contact.awaiting'),
    duplicate: t('contact.duplicate'),
    sending: t('contact.sending'),
    success: `HTTP/1.1 ${response?.code ?? 201} Created`,
    relayed: t(`contact.relay.${relayed?.channel ?? relayChannel}.status`),
    invalid: formError ? `${t('contact.invalid')} ${formError}` : t('contact.invalid'),
    limited: t('contact.limited.status'),
    failure: offline ? t('contact.failure.networkStatus') : t('contact.failure.status'),
  }[phase];

  return (
    <Section id="contact" className="contact">
      <div className="container-fluid contact__layout">
        <header className="contact__hero">
          <p className="contact__eyebrow">
            <span className="text-ember">{getStation(stationForSection('contact'))?.code}</span>
            <span aria-hidden="true" className="contact__rule" />
            <span dir="ltr">{t('contact.command')}</span>
          </p>
          <h2 id="contact-title" className="contact__title" data-contact-title>
            {titleWords.map((word, i) => (
              <span key={`${word}-${i}`} className="kin">
                <span className="kin__inner" data-kin>
                  {word}
                </span>{' '}
              </span>
            ))}
          </h2>
          {settings?.contact?.subtitle && (
            <p className="contact__subtitle">{settings.contact.subtitle}</p>
          )}
        </header>

        <div id="contact-form" className="contact__grid">
          <div className="contact__builder">
            <h3 className="contact__label">{t('contact.builder')}</h3>
            <AnimatePresence mode="wait" initial={false}>
              {phase === 'success' ? (
                <m.div
                  key="success"
                  className="req__result"
                  variants={SWAP}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  ref={resultRef}
                  tabIndex={-1}
                  role="status"
                >
                  <p className="req__stamp" dir="ltr">
                    {response?.code ?? 201} <span>Created</span>
                  </p>
                  <p className="req__result-title">{t('contact.success.title')}</p>
                  {!isLiveResource('contact') && (
                    <p className="req__mock" role="note">
                      {t('contact.mock')}
                    </p>
                  )}
                  <button type="button" className="req__again" onClick={again}>
                    {t('contact.again')}
                  </button>
                </m.div>
              ) : phase === 'relayed' && relayed ? (
                <m.div
                  key="relayed"
                  className="req__result"
                  variants={SWAP}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  ref={resultRef}
                  tabIndex={-1}
                  role="status"
                >
                  <p className="req__stamp" dir="ltr">
                    302 <span>Found</span>
                  </p>
                  <p className="req__result-title">{t(`contact.relay.${relayed.channel}.title`)}</p>
                  <p className="req__result-body">{t(`contact.relay.${relayed.channel}.body`)}</p>
                  <a
                    className="req__again"
                    href={relayed.url}
                    {...(relayed.channel === 'whatsapp'
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                  >
                    {t(`contact.relay.${relayed.channel}.open`)}
                  </a>
                  <button type="button" className="req__again" onClick={again}>
                    {t('contact.again')}
                  </button>
                </m.div>
              ) : (
                <m.form
                  key="form"
                  className="req"
                  variants={SWAP}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  onSubmit={onSubmit}
                  noValidate
                  aria-describedby={relay ? 'contact-relay-note contact-status' : 'contact-status'}
                >
                  <div className="req__row">
                    <Field name="name" label={t('contact.fields.name')} error={errors.name}>
                      {(props) => (
                        <input
                          {...props}
                          {...register('name')}
                          className="req__input"
                          autoComplete="name"
                          maxLength={80}
                        />
                      )}
                    </Field>
                    <Field name="email" label={t('contact.fields.email')} error={errors.email}>
                      {(props) => (
                        <input
                          {...props}
                          {...register('email')}
                          className="req__input"
                          type="email"
                          autoComplete="email"
                          dir="ltr"
                          maxLength={160}
                        />
                      )}
                    </Field>
                  </div>
                  <div className="req__row">
                    <Field name="phone" label={t('contact.fields.phone')} error={errors.phone}>
                      {(props) => (
                        <input
                          {...props}
                          {...register('phone')}
                          className="req__input"
                          type="tel"
                          autoComplete="tel"
                          dir="ltr"
                          maxLength={20}
                        />
                      )}
                    </Field>
                    <Field name="type" label={t('contact.fields.type')} error={errors.type}>
                      {(props) => (
                        <select {...props} {...register('type')} className="req__input req__select">
                          <option value="">{t('contact.fields.typePlaceholder')}</option>
                          {settings?.contact?.project_types?.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </Field>
                  </div>
                  <Field name="message" label={t('contact.fields.message')} error={errors.message}>
                    {(props) => (
                      <textarea
                        {...props}
                        {...register('message')}
                        className="req__input req__textarea"
                        rows={6}
                        maxLength={2000}
                        placeholder={t('contact.fields.messagePlaceholder')}
                      />
                    )}
                  </Field>
                  {/* Honeypot: off-screen, unfocusable, ignored by assistive technology. */}
                  <div className="req__trap" aria-hidden="true">
                    <label htmlFor="contact-website">{t('contact.fields.website')}</label>
                    <input
                      id="contact-website"
                      {...register('website')}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  {relay && (
                    <p id="contact-relay-note" className="req__relay" role="note">
                      {t(`contact.relay.${relayChannel}.note`)}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="req__send"
                    data-state={phase}
                    disabled={phase === 'sending'}
                    aria-busy={phase === 'sending' ? 'true' : undefined}
                  >
                    <span className="req__send-bar" aria-hidden="true" />
                    <span className="req__send-label">
                      {phase === 'sending'
                        ? t('contact.sending')
                        : phase === 'failure'
                          ? t('contact.retry')
                          : relay
                            ? t(`contact.relay.${relayChannel}.submit`)
                            : t('contact.submit')}
                    </span>
                    {phase !== 'sending' && <LineIcon name="arrow" className="req__send-icon" />}
                  </button>

                  {phase === 'failure' && (
                    <div className="req__failure" ref={resultRef} tabIndex={-1} role="alert">
                      <p className="req__failure-status" dir="ltr">
                        {offline ? t('contact.failure.networkStatus') : t('contact.failure.status')}
                      </p>
                      <p>{offline ? t('contact.failure.network') : t('contact.failure.body')}</p>
                    </div>
                  )}

                  {phase === 'limited' && (
                    <div className="req__failure" ref={resultRef} tabIndex={-1} role="alert">
                      <p className="req__failure-status" dir="ltr">
                        {t('contact.limited.status')}
                      </p>
                      <p>{t('contact.limited.body')}</p>
                    </div>
                  )}
                </m.form>
              )}
            </AnimatePresence>
          </div>

          <aside className="contact__preview" aria-labelledby="contact-preview-title">
            <p id="contact-preview-title" className="contact__label">
              {t('contact.preview')}
            </p>
            <pre className="req__wire" dir="ltr" aria-describedby="contact-preview-hint">
              <code>{requestPreview(values, locale, typeLabelOf(values.type))}</code>
            </pre>
            <p id="contact-preview-hint" className="sr-only">
              {t('contact.previewHint')}
            </p>
            <p
              id="contact-status"
              className="req__status"
              data-phase={phase}
              role="status"
              aria-live="polite"
            >
              <span className="req__status-dot" aria-hidden="true" />
              <span dir={phase === 'success' ? 'ltr' : undefined}>{status}</span>
            </p>
          </aside>
        </div>

        {/* The Response station: where the reply comes from. */}
        <div className="contact__reply" data-station="response" data-station-anchor="true">
          <div className="reply">
            <p className="contact__label">{t('contact.direct')}</p>
            <ul className="reply__channels">
              {general?.email && (
                <li>
                  <a className="reply__channel" href={`mailto:${general.email}`}>
                    <LineIcon name="mail" />
                    <span className="reply__kind">{t('contact.email')}</span>
                    <span className="reply__value" dir="ltr">
                      {general.email}
                    </span>
                  </a>
                </li>
              )}
              {whatsapp && (
                <li>
                  <a
                    className="reply__channel"
                    href={whatsapp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <LineIcon name="chat" />
                    <span className="reply__kind">{t('contact.whatsapp')}</span>
                    <span className="reply__value" dir="ltr">
                      {whatsapp.url.replace(/^https?:\/\//, '')}
                    </span>
                    <span className="sr-only">{t('a11y.externalLink')}</span>
                  </a>
                </li>
              )}
              {general?.phone && (
                <li>
                  <a className="reply__channel" href={`tel:${general.phone}`}>
                    <LineIcon name="phone" />
                    <span className="reply__kind">{t('contact.phone')}</span>
                    <span className="reply__value" dir="ltr">
                      {general.phone}
                    </span>
                  </a>
                </li>
              )}
            </ul>
          </div>
          {socials.length > 0 && (
            <div className="reply reply--ls">
              <p className="contact__label" dir="ltr">
                <span className="text-signal">~</span> $ {t('contact.socials')}
              </p>
              <ul className="reply__ls" dir="ltr">
                {socials.map((social) => (
                  <li key={social.platform}>
                    <a href={social.url} target="_blank" rel="noopener noreferrer">
                      <span className="reply__perm" aria-hidden="true">
                        lrwxr-xr-x
                      </span>{' '}
                      {social.platform}
                      <span aria-hidden="true"> → </span>
                      <span className="reply__url">{social.url.replace(/^https?:\/\//, '')}</span>
                      <span className="sr-only">{t('a11y.externalLink')}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <SectionFx target="contact">
        <ContactDirector />
      </SectionFx>
    </Section>
  );
}
