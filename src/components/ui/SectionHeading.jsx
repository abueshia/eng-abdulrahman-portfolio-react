import { cn } from '@/utils/cn';

/**
 * Consistent section heading: mono index + eyebrow, then a display title.
 * The `id` is what `<Section aria-labelledby>` points to.
 *
 * @param {Object} props
 * @param {string} props.id           Heading id, conventionally `${sectionId}-title`.
 * @param {string} [props.index]      Ordinal like "03".
 * @param {string} [props.eyebrow]
 * @param {import('react').ReactNode} props.title
 * @param {import('react').ReactNode} [props.description]
 * @param {'h1' | 'h2'} [props.as='h2']
 * @param {string} [props.className]
 */
export function SectionHeading({
  id,
  index,
  eyebrow,
  title,
  description,
  as: Tag = 'h2',
  className,
}) {
  return (
    <header className={cn('flex max-w-3xl flex-col gap-5', className)}>
      {(index || eyebrow) && (
        <p className="flex items-center gap-3 font-mono text-xs tracking-widest text-ink-dim uppercase">
          {index && <span className="text-ember">{index}</span>}
          <span aria-hidden="true" className="h-px w-8 bg-line-strong" />
          {eyebrow}
        </p>
      )}
      <Tag
        id={id}
        className="font-display text-display-md font-semibold tracking-tight text-balance text-ink"
      >
        {title}
      </Tag>
      {description && <p className="max-w-2xl text-lg text-pretty text-ink-muted">{description}</p>}
    </header>
  );
}
