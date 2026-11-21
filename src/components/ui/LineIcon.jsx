/**
 * Small line icons (Lucide geometry) for lazily loaded features.
 *
 * Why not react-icons here: its icon set is a single module that already
 * lives in the initial bundle (the navbar uses it), so every new icon
 * imported anywhere would grow the initial JS. These paths ship with the
 * chunk that renders them.
 */
const PATHS = {
  plus: 'M5 12h14M12 5v14',
  check: 'M20 6 9 17l-5-5',
  copy: 'M8 8h12v12H8zM4 16V4h12',
  mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
  phone:
    'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z',
  chat: 'M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 20.5l1.7-5.3A8.5 8.5 0 1 1 21 11.5z',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  x: 'M18 6 6 18M6 6l12 12',
  pen: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  'chevron-left': 'm15 18-6-6 6-6',
  'chevron-right': 'm9 18 6-6-6-6',
  lock: 'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM7 11V7a5 5 0 0 1 10 0v4',
  github:
    'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4M9 18c-4.51 2-5-2-7-2',
};

/**
 * Decorative by default (`aria-hidden`); give the control around it a name.
 * @param {{ name: keyof typeof PATHS, className?: string }} props
 */
export function LineIcon({ name, className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
