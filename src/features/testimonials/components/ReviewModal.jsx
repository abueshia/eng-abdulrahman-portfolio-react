import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, m } from 'motion/react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import '@/i18n/sections';
import { LineIcon } from '@/components/ui/LineIcon';
import { api, isLiveResource } from '@/config/api';
import { openRelay, relayTarget } from '@/features/contact/lib/relay';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { useLocale } from '@/hooks/useLocale';
import { useSettings } from '@/hooks/useSettings';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { testimonialsService } from '@/services/api';
import { retryAfterSeconds } from '@/services/api/rate-limit';
import { EASE } from '@/utils/motion';
import { initials } from '../lib/avatar';
import { AVATAR_TYPES, checkImageFile, squareAvatar } from '../lib/avatar-image';
import { reviewRelayMessage } from '../lib/review-relay';
import {
  EMPTY_REVIEW,
  REVIEW_LIMITS,
  reviewFieldFor,
  reviewFingerprint,
  reviewSchema,
  toReviewPayload,
} from '../lib/review-schema';
import { Avatar } from './Avatar';
import { StarIcon } from './Stars';

/** @typedef {'idle' | 'sending' | 'success' | 'relayed' | 'invalid' | 'limited' | 'failure' | 'duplicate'} Phase */

const W = 'testimonials.write';

const SWAP = {
  initial: { clipPath: 'inset(0% 0% 100% 0%)' },
  animate: { clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: 0.6, ease: EASE.outExpo } },
  exit: { clipPath: 'inset(100% 0% 0% 0%)', transition: { duration: 0.3, ease: EASE.shutter } },
};

/**
 * Error text: zod messages are i18n keys, 422 messages come from the server
 * as text and are shown as is.
 * @param {(key: string, options?: object) => string} t
 * @param {{ type?: string, message?: string } | undefined} error
 */
const errorText = (t, error) =>
  error?.message
    ? error.type === 'server'
      ? error.message
      : t(error.message, { defaultValue: t(`${W}.errors.server`) })
    : null;

/**
 * A labelled field with its error and optional extra descriptions.
 * @param {{ name: string, label: string, error?: { type?: string, message?: string },
 *   describedBy?: string, children: (props: Record<string, unknown>) => import('react').ReactNode,
 *   after?: import('react').ReactNode }} props
 */
function Field({ name, label, error, describedBy, children, after }) {
  const { t } = useTranslation();
  const errorId = `review-${name}-error`;
  const message = errorText(t, error);
  const ids = [describedBy, message ? errorId : null].filter(Boolean).join(' ');
  return (
    <div className="req__field" data-invalid={message ? 'true' : undefined}>
      <label htmlFor={`review-${name}`} className="req__label">
        {label}
      </label>
      {children({
        id: `review-${name}`,
        'aria-invalid': message ? 'true' : 'false',
        'aria-describedby': ids || undefined,
      })}
      {after}
      {message && (
        <p id={errorId} className="req__error">
          {message}
        </p>
      )}
    </div>
  );
}

/**
 * "Write a review": the visitor review form in a modal `<dialog>`.
 *
 * Lazy chunk (with react-hook-form + zod), loaded when the visitor nears or
 * presses the trigger; never prerendered.
 *
 * - Native modal dialog: top layer, the page behind is inert (focus stays
 *   inside), `Esc` and a click on the backdrop close it, page scroll is
 *   locked (CSS `:has()` + Lenis stopped). The trigger gets focus back.
 *   A bottom sheet on phones.
 * - Fields are the API's (`POST /testimonials`, API_CONTRACT.md §5): name,
 *   job title and company (optional), a 1-5 star radio group (arrow keys
 *   follow the reading direction, a text label names the choice), the review
 *   with a character counter, the project it is about (optional, published
 *   projects), an optional photo (picked or dropped, checked, cropped square
 *   to 256 px and re-encoded in the browser, which strips EXIF) and a
 *   required publication consent. Texts are sent under the page language.
 *   Without a photo, a monogram avatar updates as the name is typed.
 * - Honeypot, no double submit, HTML refused. Submitting shows a progress
 *   bar, then the thank-you screen (published after review, never
 *   instantly), the server's 422 errors on their fields (`name.ar` lands on
 *   the name), "try again shortly" on 429, or a network/server failure with
 *   Retry. What the visitor typed is never lost.
 * - When `testimonials` is not a live resource: development says the review
 *   was not delivered; production relays to WhatsApp or email.
 *
 * @param {{ onClose: () => void }} props
 */
export default function ReviewModal({ onClose }) {
  const { t } = useTranslation();
  const { dir, locale } = useLocale();
  const { lenisRef } = useSmoothScroll();
  const { data } = useSettings();
  const { data: projectsData } = useProjects();
  const projects = projectsData?.data ?? [];
  const general = data?.data?.general;
  const whatsapp = general?.socials?.find((/** @type {any} */ s) => s.platform === 'whatsapp');
  const relay = api.reviewRelay;
  const relayChannel = whatsapp ? 'whatsapp' : 'email';
  const uid = useId();
  const titleId = `${uid}-title`;
  const leadId = `${uid}-lead`;

  const dialogRef = useRef(/** @type {HTMLDialogElement | null} */ (null));
  const starsRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const previewRef = useRef(/** @type {HTMLImageElement | null} */ (null));
  const pressedBackdrop = useRef(false);
  const alive = useRef(true);
  const photoJob = useRef(0);

  const [phase, setPhase] = useState(/** @type {Phase} */ ('idle'));
  const [sentKey, setSentKey] = useState(/** @type {string | null} */ (null));
  const [relayed, setRelayed] = useState(
    /** @type {{ channel: 'whatsapp' | 'email', url: string } | null} */ (null),
  );
  const [hover, setHover] = useState(0);
  const [photo, setPhoto] = useState(/** @type {Blob | null} */ (null));
  const [photoError, setPhotoError] = useState(
    /** @type {{ key?: string, message?: string } | null} */ (null),
  );
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
  /** Seconds to wait after a 429 (`Retry-After`), when the API said. */
  const [retryAfter, setRetryAfter] = useState(/** @type {number | null} */ (null));
  /** Server message of a 422 that names no visible field. */
  const [formError, setFormError] = useState(/** @type {string | null} */ (null));
  /** The last failure was the network (no response), not the server. */
  const [offline, setOffline] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setError,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: EMPTY_REVIEW,
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });
  const [name, message, rating] = useWatch({ control, name: ['name', 'description', 'rating'] });

  // Open as a modal; undo everything on unmount (StrictMode-safe).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    // Focus the first field once the dialog is open (autoFocus would run while it is hidden).
    dialog.querySelector('#review-name')?.focus();
    const lenis = lenisRef.current;
    lenis?.stop();
    return () => {
      lenis?.start();
      if (typeof dialog.close === 'function' && dialog.open) dialog.close();
      else dialog.removeAttribute('open');
    };
  }, [lenisRef]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // Photo preview: one object URL per processed blob, revoked when it changes
  // or the dialog closes. Set imperatively, so no state holds a dead URL.
  useEffect(() => {
    const image = previewRef.current;
    if (!photo || !image) return undefined;
    const url = URL.createObjectURL(photo);
    image.src = url;
    return () => {
      image.removeAttribute('src');
      URL.revokeObjectURL(url);
    };
  }, [photo]);

  // Result panels take focus when they actually mount (after the form's exit).
  const focusOnMount = useCallback((/** @type {HTMLElement | null} */ node) => {
    node?.focus();
  }, []);

  /** @param {File | undefined | null} file */
  const takeFile = async (file) => {
    if (!file) return;
    const problem = checkImageFile(file);
    if (problem) {
      setPhotoError({ key: problem });
      return;
    }
    const job = ++photoJob.current;
    setPhotoError(null);
    setProcessing(true);
    try {
      const blob = await squareAvatar(file);
      if (alive.current && job === photoJob.current) setPhoto(blob);
    } catch {
      if (alive.current && job === photoJob.current) setPhotoError({ key: 'photoRead' });
    } finally {
      if (alive.current && job === photoJob.current) setProcessing(false);
    }
  };

  const removePhoto = () => {
    photoJob.current += 1;
    setPhoto(null);
    setPhotoError(null);
    setProcessing(false);
    // The remove button disappears: keep focus in the photo controls.
    dialogRef.current?.querySelector('#review-avatar')?.focus();
  };

  /** Star radios: arrows follow the reading direction, Home/End jump. */
  const onStarKey = (/** @type {import('react').KeyboardEvent<HTMLInputElement>} */ event) => {
    const forward = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const back = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    const from = Number(event.currentTarget.value) || 1;
    /** @type {Record<string, number>} */
    const moves = {
      [forward]: Math.min(5, from + 1),
      ArrowDown: Math.min(5, from + 1),
      [back]: Math.max(1, from - 1),
      ArrowUp: Math.max(1, from - 1),
      Home: 1,
      End: 5,
    };
    const next = moves[event.key];
    if (!next) return;
    event.preventDefault();
    setHover(0);
    setValue('rating', String(next), {
      shouldValidate: true,
      shouldTouch: true,
      shouldDirty: true,
    });
    starsRef.current?.querySelector(`input[value="${next}"]`)?.focus();
  };

  const onSubmit = handleSubmit(async (values) => {
    if (phase === 'sending' || processing) return;
    const payload = toReviewPayload(values, locale, photo);
    const key = reviewFingerprint(payload);
    if (sentKey === key) {
      setPhase('duplicate');
      return;
    }
    if (relay) {
      const text = reviewRelayMessage(payload, {
        greeting: t(`${W}.relay.greeting`, { name: payload.name }),
        role: t(`${W}.relay.role`),
        rating: t(`${W}.relay.rating`, { value: payload.rating }),
      });
      const target = relayTarget(
        {
          whatsapp: whatsapp?.url,
          email: general?.email,
          subject: t(`${W}.relay.subject`, { name: payload.name }),
        },
        text,
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
      await testimonialsService.submit(payload);
      setSentKey(key);
      setPhase('success');
    } catch (error) {
      const apiError = /** @type {any} */ (error);
      // The form keeps every value: only the phase changes.
      if (apiError?.isValidation) {
        let placed = false;
        Object.entries(apiError.errors ?? {}).forEach(([key, messages]) => {
          const text = [messages].flat()[0];
          const field = reviewFieldFor(key);
          if (field === 'image') setPhotoError({ message: text });
          else if (field) setError(/** @type {any} */ (field), { type: 'server', message: text });
          if (field) placed = true;
        });
        if (!placed) setFormError(apiError.message || null);
        setPhase('invalid');
      } else if (apiError?.isRateLimited) {
        setRetryAfter(retryAfterSeconds(apiError));
        setPhase('limited');
      } else {
        setOffline(Boolean(apiError?.isNetwork));
        setPhase('failure');
      }
    }
  });

  const shown = hover || Number(rating) || 0;
  const messageLength = String(message ?? '').length;
  const ratingError = errorText(t, errors.rating);
  const consentError = errorText(t, errors.consent);
  const photoMessage = photoError
    ? (photoError.message ?? t(`${W}.errors.${photoError.key}`))
    : null;
  const letters = initials(name);
  const status = {
    idle: null,
    sending: t(`${W}.sending`),
    success: null,
    relayed: null,
    invalid: formError ? `${t(`${W}.invalid`)} ${formError}` : t(`${W}.invalid`),
    limited: null,
    failure: null,
    duplicate: t(`${W}.duplicate`),
  }[phase];

  return (
    <dialog
      ref={dialogRef}
      className="rv-dialog"
      aria-labelledby={titleId}
      aria-describedby={leadId}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
        }
      }}
      onPointerDown={(event) => {
        pressedBackdrop.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && pressedBackdrop.current) onClose();
        pressedBackdrop.current = false;
      }}
      data-lenis-prevent
    >
      <div className="rv-sheet">
        <header className="rv-sheet__head">
          <span className="rv-sheet__grip" aria-hidden="true" />
          <p className="rv-sheet__cmd" dir="ltr" aria-hidden="true">
            {t(`${W}.command`)}
          </p>
          <h2 id={titleId} className="rv-sheet__title">
            {t(`${W}.title`)}
          </h2>
          <p id={leadId} className="rv-sheet__lead">
            {t(`${W}.lead`)}
          </p>
          <button
            type="button"
            className="rv-sheet__close"
            onClick={onClose}
            aria-label={t(`${W}.close`)}
          >
            <LineIcon name="x" />
          </button>
        </header>

        <div className="rv-sheet__body">
          <AnimatePresence mode="wait" initial={false}>
            {phase === 'success' || (phase === 'relayed' && relayed) ? (
              <m.div
                key="done"
                className="req__result"
                variants={SWAP}
                initial="initial"
                animate="animate"
                exit="exit"
                ref={focusOnMount}
                tabIndex={-1}
                role="status"
              >
                <p className="req__stamp" dir="ltr">
                  {phase === 'success' ? (
                    <>
                      201 <span>Created · pending</span>
                    </>
                  ) : (
                    <>
                      302 <span>Found</span>
                    </>
                  )}
                </p>
                <p className="req__result-title">
                  {phase === 'success'
                    ? t(`${W}.success.title`)
                    : t(`${W}.relay.${relayed?.channel}.title`)}
                </p>
                {phase === 'relayed' && (
                  <p className="req__result-body">{t(`${W}.relay.${relayed?.channel}.body`)}</p>
                )}
                {phase === 'success' && !isLiveResource('testimonials') && (
                  <p className="req__mock" role="note">
                    {t(`${W}.mock`)}
                  </p>
                )}
                <div className="rv-actions">
                  {phase === 'relayed' && relayed && (
                    <a
                      className="req__again"
                      href={relayed.url}
                      {...(relayed.channel === 'whatsapp'
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                    >
                      {t(`${W}.relay.${relayed.channel}.open`)}
                    </a>
                  )}
                  <button type="button" className="rv-done" onClick={onClose}>
                    {t(`${W}.done`)}
                  </button>
                </div>
              </m.div>
            ) : (
              <m.form
                key="form"
                className="rv-form"
                variants={SWAP}
                initial="initial"
                animate="animate"
                exit="exit"
                onSubmit={onSubmit}
                noValidate
                aria-labelledby={titleId}
              >
                <Field name="name" label={t(`${W}.fields.name`)} error={errors.name}>
                  {(props) => (
                    <input
                      {...props}
                      {...register('name')}
                      className="req__input"
                      autoComplete="name"
                      maxLength={REVIEW_LIMITS.name.max}
                    />
                  )}
                </Field>
                <div className="req__row">
                  <Field name="name_job" label={t(`${W}.fields.role`)} error={errors.name_job}>
                    {(props) => (
                      <input
                        {...props}
                        {...register('name_job')}
                        className="req__input"
                        autoComplete="organization-title"
                        maxLength={REVIEW_LIMITS.name_job.max}
                      />
                    )}
                  </Field>
                  <Field
                    name="company_name"
                    label={t(`${W}.fields.company`)}
                    error={errors.company_name}
                  >
                    {(props) => (
                      <input
                        {...props}
                        {...register('company_name')}
                        className="req__input"
                        autoComplete="organization"
                        maxLength={REVIEW_LIMITS.company_name.max}
                      />
                    )}
                  </Field>
                </div>

                <fieldset
                  className="rate"
                  data-invalid={ratingError ? 'true' : undefined}
                  aria-describedby={`review-rating-value${ratingError ? ' review-rating-error' : ''}`}
                >
                  <legend className="req__label">{t(`${W}.fields.rating`)}</legend>
                  <div className="rate__row">
                    <div className="rate__stars" ref={starsRef} onPointerLeave={() => setHover(0)}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <label
                          key={n}
                          className="rate__star"
                          style={{ '--i': n }}
                          data-on={n <= shown ? 'true' : undefined}
                          onPointerEnter={() => setHover(n)}
                        >
                          <input
                            type="radio"
                            className="rate__input"
                            value={String(n)}
                            {...register('rating')}
                            onKeyDown={onStarKey}
                            aria-invalid={ratingError ? 'true' : undefined}
                          />
                          <StarIcon on={n <= shown} />
                          <span className="sr-only">
                            {t(`${W}.ratingStar`, { count: n })}, {t(`${W}.ratingLabels.${n}`)}
                          </span>
                        </label>
                      ))}
                    </div>
                    <p
                      id="review-rating-value"
                      className="rate__value"
                      data-on={shown ? 'true' : undefined}
                    >
                      {shown ? t(`${W}.ratingLabels.${shown}`) : t(`${W}.ratingNone`)}
                    </p>
                  </div>
                  {ratingError && (
                    <p id="review-rating-error" className="req__error">
                      {ratingError}
                    </p>
                  )}
                </fieldset>

                <Field
                  name="description"
                  label={t(`${W}.fields.message`)}
                  error={errors.description}
                  describedBy="review-description-count"
                  after={
                    <p
                      id="review-description-count"
                      className="rv-counter"
                      data-near={
                        messageLength > REVIEW_LIMITS.description.max * 0.9 ? 'true' : undefined
                      }
                    >
                      {t(`${W}.fields.counter`, {
                        count: messageLength,
                        max: REVIEW_LIMITS.description.max,
                      })}
                    </p>
                  }
                >
                  {(props) => (
                    <textarea
                      {...props}
                      {...register('description')}
                      className="req__input req__textarea"
                      rows={5}
                      maxLength={REVIEW_LIMITS.description.max}
                      placeholder={t(`${W}.fields.messagePlaceholder`)}
                    />
                  )}
                </Field>

                {projects.length > 0 && (
                  <Field
                    name="project_id"
                    label={t(`${W}.fields.project`)}
                    error={errors.project_id}
                  >
                    {(props) => (
                      <select
                        {...props}
                        {...register('project_id')}
                        className="req__input req__select"
                      >
                        <option value="">{t(`${W}.fields.projectNone`)}</option>
                        {projects.map((project) => (
                          <option key={project.id} value={String(project.id)}>
                            {project.title}
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>
                )}

                <div
                  className="rv-photo"
                  role="group"
                  aria-labelledby="review-avatar-label"
                  data-drag={dragging ? 'true' : undefined}
                  data-invalid={photoMessage ? 'true' : undefined}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'copy';
                  }}
                  onDragLeave={(event) => {
                    if (!event.currentTarget.contains(/** @type {Node} */ (event.relatedTarget))) {
                      setDragging(false);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    takeFile(event.dataTransfer.files?.[0]);
                  }}
                >
                  <div className="rv-photo__preview">
                    {photo ? (
                      <img
                        ref={previewRef}
                        className="avatar avatar--lg avatar--photo"
                        alt={t(`${W}.fields.photoPreview`)}
                        width={72}
                        height={72}
                      />
                    ) : (
                      <Avatar
                        name={name}
                        size="lg"
                        label={t(`${W}.fields.avatarDefault`, { initials: letters || '—' })}
                      />
                    )}
                  </div>
                  <div className="rv-photo__body">
                    <p id="review-avatar-label" className="req__label">
                      {t(`${W}.fields.photo`)}
                    </p>
                    <div className="rv-photo__actions">
                      <input
                        id="review-avatar"
                        type="file"
                        className="rv-photo__input"
                        accept={AVATAR_TYPES.join(',')}
                        aria-describedby={`review-avatar-hint${photoMessage ? ' review-avatar-error' : ''}`}
                        aria-invalid={photoMessage ? 'true' : undefined}
                        onChange={(event) => {
                          takeFile(event.currentTarget.files?.[0]);
                          event.currentTarget.value = '';
                        }}
                      />
                      <label htmlFor="review-avatar" className="rv-photo__choose">
                        <LineIcon name="upload" />
                        {t(`${W}.fields.photoChoose`)}
                      </label>
                      <span className="rv-photo__drop">{t(`${W}.fields.photoDrop`)}</span>
                      {photo && (
                        <button type="button" className="rv-photo__remove" onClick={removePhoto}>
                          {t(`${W}.fields.photoRemove`)}
                        </button>
                      )}
                    </div>
                    <p id="review-avatar-hint" className="rv-photo__hint">
                      {t(`${W}.fields.photoHint`)}
                    </p>
                    {processing && (
                      <p className="rv-photo__hint" role="status">
                        {t(`${W}.fields.photoProcessing`)}
                      </p>
                    )}
                    {photoMessage && (
                      <p id="review-avatar-error" className="req__error" role="alert">
                        {photoMessage}
                      </p>
                    )}
                  </div>
                </div>

                <div className="req__field" data-invalid={consentError ? 'true' : undefined}>
                  <label className="rv-consent" htmlFor="review-consent">
                    <input
                      id="review-consent"
                      type="checkbox"
                      {...register('consent')}
                      aria-invalid={consentError ? 'true' : 'false'}
                      aria-describedby={consentError ? 'review-consent-error' : undefined}
                    />
                    <span>{t(`${W}.fields.consent`)}</span>
                  </label>
                  {consentError && (
                    <p id="review-consent-error" className="req__error">
                      {consentError}
                    </p>
                  )}
                </div>

                {/* Honeypot: off-screen, unfocusable, ignored by assistive technology. */}
                <div className="req__trap" aria-hidden="true">
                  <label htmlFor="review-website">{t(`${W}.fields.hp`)}</label>
                  <input
                    id="review-website"
                    {...register('website')}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                {relay && (
                  <p id="review-relay-note" className="req__relay" role="note">
                    {t(`${W}.relay.${relayChannel}.note`)} {t(`${W}.relay.photoNote`)}
                  </p>
                )}

                <button
                  type="submit"
                  className="req__send"
                  data-state={phase}
                  disabled={phase === 'sending' || processing}
                  aria-busy={phase === 'sending' ? 'true' : undefined}
                  aria-describedby={relay ? 'review-relay-note' : undefined}
                >
                  <span className="req__send-bar" aria-hidden="true" />
                  <span className="req__send-label">
                    {phase === 'sending'
                      ? t(`${W}.sending`)
                      : phase === 'failure'
                        ? t(`${W}.retry`)
                        : relay
                          ? t(`${W}.relay.${relayChannel}.submit`)
                          : t(`${W}.submit`)}
                  </span>
                  {phase !== 'sending' && <LineIcon name="arrow" className="req__send-icon" />}
                </button>

                <p className="sr-only" role="status" aria-live="polite">
                  {status}
                </p>
                {status && phase !== 'sending' && (
                  <p className="rv-status" aria-hidden="true">
                    {status}
                  </p>
                )}

                {phase === 'failure' && (
                  <div className="req__failure" ref={focusOnMount} tabIndex={-1} role="alert">
                    <p className="req__failure-status" dir="ltr">
                      {offline ? t(`${W}.failure.networkStatus`) : t(`${W}.failure.status`)}
                    </p>
                    <p>{offline ? t(`${W}.failure.network`) : t(`${W}.failure.body`)}</p>
                  </div>
                )}

                {phase === 'limited' && (
                  <div className="req__failure" ref={focusOnMount} tabIndex={-1} role="alert">
                    <p className="req__failure-status" dir="ltr">
                      429 Too Many Requests
                    </p>
                    <p>
                      {retryAfter && retryAfter > 60
                        ? t(`${W}.limited.minutes`, { count: Math.ceil(retryAfter / 60) })
                        : t(`${W}.limited.body`)}
                    </p>
                  </div>
                )}
              </m.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </dialog>
  );
}
